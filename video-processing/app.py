import asyncio
import logging
import os
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import cv2
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}
MAX_STORED_DETECTIONS = 5000
DEFAULT_CORS_ORIGINS = (
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173"
)

logger = logging.getLogger("scis.video_processing")


class ConfigError(ValueError):
    """Raised when SCIS environment configuration is invalid."""


@dataclass(frozen=True)
class Settings:
    model_path: Path
    upload_dir: Path
    output_dir: Path
    max_upload_bytes: int
    frame_stride: int
    confidence: float
    cors_origins: list[str]
    output_retention_seconds: int
    output_cleanup_interval_seconds: int
    output_cleanup_enabled: bool

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> "Settings":
        source = dict(os.environ) if env is None else env

        model_path = cls._parse_model_path(source.get("SCIS_MODEL_PATH", str(BASE_DIR / "models" / "floating_waste.pt")))
        upload_dir = Path(source.get("SCIS_UPLOAD_DIR", str(BASE_DIR / "uploads"))).resolve()
        output_dir = Path(source.get("SCIS_OUTPUT_DIR", str(BASE_DIR / "outputs"))).resolve()

        return cls(
            model_path=model_path,
            upload_dir=upload_dir,
            output_dir=output_dir,
            max_upload_bytes=cls._parse_int(source, "SCIS_MAX_UPLOAD_BYTES", 100 * 1024 * 1024, minimum=1),
            frame_stride=cls._parse_int(source, "SCIS_FRAME_STRIDE", 3, minimum=1),
            confidence=cls._parse_float(source, "SCIS_CONFIDENCE", 0.25, minimum=0.0, maximum=1.0),
            cors_origins=cls._parse_cors_origins(source.get("SCIS_CORS_ORIGINS", DEFAULT_CORS_ORIGINS)),
            output_retention_seconds=cls._parse_int(source, "SCIS_OUTPUT_RETENTION_SECONDS", 3600, minimum=1),
            output_cleanup_interval_seconds=cls._parse_int(source, "SCIS_OUTPUT_CLEANUP_INTERVAL_SECONDS", 300, minimum=1),
            output_cleanup_enabled=cls._parse_bool(source.get("SCIS_OUTPUT_CLEANUP_ENABLED", "true"), "SCIS_OUTPUT_CLEANUP_ENABLED"),
        )

    @staticmethod
    def _parse_model_path(raw_value: str) -> Path:
        value = (raw_value or "").strip()
        if not value:
            raise ConfigError("SCIS_MODEL_PATH must be a non-empty path.")
        return Path(value).expanduser().resolve()

    @staticmethod
    def _parse_int(source: dict[str, str], key: str, default: int, minimum: int | None = None, maximum: int | None = None) -> int:
        raw = source.get(key)
        value = default if raw is None else raw
        try:
            parsed = int(value)
        except (TypeError, ValueError) as exc:
            raise ConfigError(f"{key} must be an integer.") from exc
        if minimum is not None and parsed < minimum:
            raise ConfigError(f"{key} must be >= {minimum}.")
        if maximum is not None and parsed > maximum:
            raise ConfigError(f"{key} must be <= {maximum}.")
        return parsed

    @staticmethod
    def _parse_float(source: dict[str, str], key: str, default: float, minimum: float | None = None, maximum: float | None = None) -> float:
        raw = source.get(key)
        value = default if raw is None else raw
        try:
            parsed = float(value)
        except (TypeError, ValueError) as exc:
            raise ConfigError(f"{key} must be a number.") from exc
        if minimum is not None and parsed < minimum:
            raise ConfigError(f"{key} must be >= {minimum}.")
        if maximum is not None and parsed > maximum:
            raise ConfigError(f"{key} must be <= {maximum}.")
        return parsed

    @staticmethod
    def _parse_bool(raw_value: str, key: str) -> bool:
        value = (raw_value or "").strip().lower()
        if value in {"1", "true", "yes", "on"}:
            return True
        if value in {"0", "false", "no", "off"}:
            return False
        raise ConfigError(f"{key} must be a boolean (true/false).")

    @staticmethod
    def _parse_cors_origins(raw_value: str) -> list[str]:
        origins = [origin.strip() for origin in (raw_value or "").split(",") if origin.strip()]
        if not origins:
            raise ConfigError("SCIS_CORS_ORIGINS must include at least one origin.")
        for origin in origins:
            parsed = urlparse(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ConfigError(f"SCIS_CORS_ORIGINS contains an invalid origin: {origin}")
        return origins


class OutputLifecycleManager:
    def __init__(
        self,
        output_dir: Path,
        retention_seconds: int,
        cleanup_interval_seconds: int,
        cleanup_enabled: bool,
        time_provider: Any = time.time,
    ) -> None:
        self.output_dir = output_dir
        self.retention_seconds = retention_seconds
        self.cleanup_interval_seconds = cleanup_interval_seconds
        self.cleanup_enabled = cleanup_enabled
        self._time = time_provider
        self._active_counts: dict[Path, int] = {}
        self._last_cleanup = 0.0
        self._lock = threading.Lock()

    def activate(self, path: Path) -> None:
        with self._lock:
            self._active_counts[path] = self._active_counts.get(path, 0) + 1

    def deactivate(self, path: Path) -> None:
        with self._lock:
            count = self._active_counts.get(path, 0)
            if count <= 1:
                self._active_counts.pop(path, None)
            else:
                self._active_counts[path] = count - 1

    def is_active(self, path: Path) -> bool:
        with self._lock:
            return self._active_counts.get(path, 0) > 0

    def run_cleanup(self, *, force: bool = False, now: float | None = None) -> list[str]:
        if not self.cleanup_enabled:
            return []

        current_time = self._time() if now is None else now
        with self._lock:
            if not force and (current_time - self._last_cleanup) < self.cleanup_interval_seconds:
                return []
            self._last_cleanup = current_time

        removed: list[str] = []
        for path in self.output_dir.glob("*_annotated.mp4"):
            if not path.is_file() or self.is_active(path):
                continue

            try:
                age_seconds = current_time - path.stat().st_mtime
                if age_seconds < self.retention_seconds:
                    continue
                path.unlink(missing_ok=True)
                removed.append(path.name)
            except OSError:
                logger.warning("Failed to clean output file", extra={"output_file": str(path)}, exc_info=True)

        return removed


try:
    settings = Settings.from_env()
except ConfigError as exc:
    raise RuntimeError(f"Invalid SCIS configuration: {exc}") from exc

settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.output_dir.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SCIS Video Processing API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)

output_lifecycle = OutputLifecycleManager(
    output_dir=settings.output_dir,
    retention_seconds=settings.output_retention_seconds,
    cleanup_interval_seconds=settings.output_cleanup_interval_seconds,
    cleanup_enabled=settings.output_cleanup_enabled,
)

model = None
model_load_error = None


def _request_id_from(request: Request) -> str:
    request_id = request.headers.get("X-Request-ID", "").strip()
    return request_id or uuid.uuid4().hex


def cleanup_outputs(*, force: bool = False) -> list[str]:
    return output_lifecycle.run_cleanup(force=force)


@app.on_event("startup")
def load_model() -> None:
    """Keep the API available for health checks when model weights are not installed."""
    global model, model_load_error
    model = None
    model_load_error = None

    if not settings.model_path.is_file():
        model_load_error = "Model weights file is missing."
        logger.warning("Model weights are missing", extra={"model_path": str(settings.model_path)})
        return

    try:
        model = YOLO(str(settings.model_path))
        logger.info("Model loaded", extra={"model_path": str(settings.model_path)})
    except Exception:
        model_load_error = "Could not load model weights."
        logger.exception("Failed to load model weights", extra={"model_path": str(settings.model_path)})


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_ready": model is not None,
        "model_configured": settings.model_path.is_file(),
        "model_error": model_load_error,
        "frame_stride": settings.frame_stride,
        "confidence": settings.confidence,
        "max_upload_bytes": settings.max_upload_bytes,
        "output_retention_seconds": settings.output_retention_seconds,
        "cleanup_enabled": settings.output_cleanup_enabled,
    }


def _process_video_sync(*, job_id: str, request_id: str, input_path: Path, output_path: Path) -> dict[str, Any]:
    cap = None
    writer = None
    failed = True
    output_lifecycle.activate(output_path)

    try:
        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open the uploaded video.")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if fps <= 0 or width <= 0 or height <= 0:
            raise HTTPException(status_code=400, detail="Video metadata is invalid or unsupported.")

        writer = cv2.VideoWriter(
            str(output_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )
        if not writer.isOpened():
            raise HTTPException(status_code=500, detail="Could not initialize the annotated video writer.")

        frame_number = 0
        analyzed_frames = 0
        total_detections = 0
        detections = []
        class_counts: dict[str, int] = {}

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if frame_number % settings.frame_stride == 0:
                prediction = model.predict(
                    source=frame,
                    conf=settings.confidence,
                    verbose=False,
                )[0]
                writer.write(prediction.plot())
                analyzed_frames += 1

                if prediction.boxes is not None:
                    for box in prediction.boxes:
                        class_id = int(box.cls.item())
                        label = str(prediction.names[class_id])
                        confidence = float(box.conf.item())
                        coords = [round(float(v), 1) for v in box.xyxy[0].tolist()]
                        class_counts[label] = class_counts.get(label, 0) + 1
                        total_detections += 1
                        if len(detections) < MAX_STORED_DETECTIONS:
                            detections.append(
                                {
                                    "frame": frame_number,
                                    "timestamp_seconds": round(frame_number / fps, 3),
                                    "class": label,
                                    "confidence": round(confidence, 4),
                                    "box_xyxy": coords,
                                }
                            )
            else:
                writer.write(frame)

            frame_number += 1

        if frame_number == 0:
            raise HTTPException(status_code=400, detail="No decodable video frames were found.")

        failed = False
        return {
            "job_id": job_id,
            "request_id": request_id,
            "frames_processed": frame_number,
            "frames_analyzed": analyzed_frames,
            "total_detections": total_detections,
            "fps": round(fps, 3),
            "width": width,
            "height": height,
            "sampled_frame_detections": class_counts,
            "detections": detections,
            "annotated_video_url": f"/video/{output_path.name}",
            "note": (
                f"Model inference ran on every {settings.frame_stride} frame(s). Counts represent detections "
                "in sampled frames, not unique physical waste objects. The intervening output frames "
                "are original frames. Add tracking before treating counts as unique items."
            ),
        }
    finally:
        if cap is not None:
            cap.release()
        if writer is not None:
            writer.release()
        if failed:
            output_path.unlink(missing_ok=True)
        output_lifecycle.deactivate(output_path)


@app.post("/analyze")
async def analyze_video(request: Request, file: UploadFile = File(...)) -> dict[str, Any]:
    request_id = _request_id_from(request)

    if model is None:
        await file.close()
        raise HTTPException(
            status_code=503,
            detail=(
                f"Detection model is not loaded. request_id={request_id}. "
                "Check /health for model readiness."
            ),
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        await file.close()
        raise HTTPException(status_code=400, detail="Unsupported format. Use MP4, MOV, AVI or MKV.")

    job_id = uuid.uuid4().hex
    input_path = settings.upload_dir / f"{job_id}{suffix}"
    output_path = settings.output_dir / f"{job_id}_annotated.mp4"

    try:
        total_bytes = 0
        with input_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > settings.max_upload_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Video exceeds the {settings.max_upload_bytes} byte upload limit.",
                    )
                destination.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded video is empty.")

        response_payload = await asyncio.to_thread(
            _process_video_sync,
            job_id=job_id,
            request_id=request_id,
            input_path=input_path,
            output_path=output_path,
        )

        output_lifecycle.run_cleanup(force=False)
        return response_payload
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "Video processing failed",
            extra={"request_id": request_id, "job_id": job_id},
        )
        raise HTTPException(
            status_code=500,
            detail=f"Video processing failed. Reference request_id={request_id} job_id={job_id}.",
        )
    finally:
        await file.close()
        input_path.unlink(missing_ok=True)


@app.get("/video/{filename}")
def get_annotated_video(filename: str, request: Request):
    request_id = _request_id_from(request)

    if Path(filename).name != filename or not filename.endswith("_annotated.mp4"):
        raise HTTPException(status_code=400, detail="Invalid output filename.")

    path = settings.output_dir / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Annotated video not found.")

    output_lifecycle.activate(path)
    try:
        return FileResponse(
            path,
            media_type="video/mp4",
            filename=filename,
            background=BackgroundTask(output_lifecycle.deactivate, path),
        )
    except Exception:
        output_lifecycle.deactivate(path)
        logger.exception(
            "Failed to serve annotated video",
            extra={"request_id": request_id, "output_file": str(path)},
        )
        raise HTTPException(status_code=500, detail=f"Failed to serve video. request_id={request_id}.")


# Dataset upload and model-training workflow is separate from video inference.
from dataset_training import router as dataset_training_router  # noqa: E402

app.include_router(dataset_training_router)
