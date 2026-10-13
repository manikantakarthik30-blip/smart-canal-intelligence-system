import os
import uuid
from pathlib import Path

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
MODEL_PATH = Path(os.getenv("SCIS_MODEL_PATH", str(BASE_DIR / "models" / "floating_waste.pt")))
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}
FRAME_STRIDE = max(1, int(os.getenv("SCIS_FRAME_STRIDE", "3")))
CONFIDENCE = float(os.getenv("SCIS_CONFIDENCE", "0.25"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SCIS Video Processing API", version="0.1.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "SCIS_CORS_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

model = None


@app.on_event("startup")
def load_model():
    global model
    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Model weights are missing at {MODEL_PATH}. "
            "Provide a compatible floating-waste-trained YOLO model and set SCIS_MODEL_PATH if needed."
        )
    model = YOLO(str(MODEL_PATH))


@app.get("/health")
def health():
    return {
        "status": "ok" if model is not None else "model-not-loaded",
        "model_configured": MODEL_PATH.is_file(),
        "frame_stride": FRAME_STRIDE,
    }


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Detection model is not loaded.")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported format. Use MP4, MOV, AVI or MKV.")

    job_id = uuid.uuid4().hex
    input_path = UPLOAD_DIR / f"{job_id}{suffix}"
    output_path = OUTPUT_DIR / f"{job_id}_annotated.mp4"
    cap = None
    writer = None

    try:
        total_bytes = 0
        with input_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Video exceeds the 100 MB upload limit.")
                destination.write(chunk)
        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded video is empty.")

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
        detections = []
        class_counts = {}

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if frame_number % FRAME_STRIDE == 0:
                prediction = model.predict(
                    source=frame,
                    conf=CONFIDENCE,
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
                        # Cap returned detail to keep API responses manageable.
                        if len(detections) < 5000:
                            detections.append({
                                "frame": frame_number,
                                "timestamp_seconds": round(frame_number / fps, 3),
                                "class": label,
                                "confidence": round(confidence, 4),
                                "box_xyxy": coords,
                            })
            else:
                writer.write(frame)

            frame_number += 1

        if frame_number == 0:
            raise HTTPException(status_code=400, detail="No decodable video frames were found.")

        return {
            "job_id": job_id,
            "frames_processed": frame_number,
            "frames_analyzed": analyzed_frames,
            "fps": round(fps, 3),
            "width": width,
            "height": height,
            "sampled_frame_detections": class_counts,
            "detections": detections,
            "annotated_video_url": f"/video/{output_path.name}",
            "note": (
                f"Model inference ran on every {FRAME_STRIDE} frame(s). Counts represent detections "
                "in sampled frames, not unique physical waste objects. The intervening output frames "
                "are original frames. Add tracking before treating counts as unique items."
            ),
        }
    except HTTPException:
        output_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Video processing failed: {exc}") from exc
    finally:
        if cap is not None:
            cap.release()
        if writer is not None:
            writer.release()
        await file.close()
        input_path.unlink(missing_ok=True)


@app.get("/video/{filename}")
def get_annotated_video(filename: str):
    if Path(filename).name != filename or not filename.endswith("_annotated.mp4"):
        raise HTTPException(status_code=400, detail="Invalid output filename.")
    path = OUTPUT_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Annotated video not found.")
    return FileResponse(path, media_type="video/mp4", filename=filename)
