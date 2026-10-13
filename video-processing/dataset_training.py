"""Separate dataset upload and YOLO training workflow for SCIS.

Expected ZIP structure is a standard YOLO detection dataset containing data.yaml,
image files, and matching YOLO label text files. Uploading a ZIP never starts training.
"""
import asyncio
import logging
import shutil
import uuid
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

import yaml
from fastapi import APIRouter, File, HTTPException, UploadFile
from ultralytics import YOLO

from app import BASE_DIR, settings

logger = logging.getLogger("scis.dataset_training")
router = APIRouter(prefix="/datasets", tags=["Dataset training"])

DATASET_DIR = BASE_DIR / "datasets"
TRAINING_DIR = BASE_DIR / "training-runs"
MAX_DATASET_ZIP_BYTES = 500 * 1024 * 1024
MAX_DATASET_UNPACKED_BYTES = 2 * 1024 * 1024 * 1024
MAX_DATASET_FILES = 20000
MAX_TRAIN_EPOCHS = 100
ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _safe_extract_and_validate(zip_path: Path, target: Path) -> dict[str, Any]:
    total_size = 0
    entries: list[zipfile.ZipInfo] = []
    with zipfile.ZipFile(zip_path) as archive:
        entries = [item for item in archive.infolist() if not item.is_dir()]
        if not entries or len(entries) > MAX_DATASET_FILES:
            raise ValueError(f"Dataset must contain between 1 and {MAX_DATASET_FILES} files.")
        for item in entries:
            name = item.filename.replace("\\", "/")
            path = PurePosixPath(name)
            if path.is_absolute() or any(part in {"..", ""} for part in path.parts):
                raise ValueError("Dataset ZIP contains an unsafe file path.")
            if (item.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Dataset ZIP must not contain symbolic links.")
            total_size += item.file_size
            if total_size > MAX_DATASET_UNPACKED_BYTES:
                raise ValueError("Dataset expands beyond the 2 GB safety limit.")
        archive.extractall(target)

    yaml_candidates = list(target.rglob("data.yaml")) + list(target.rglob("data.yml"))
    if len(yaml_candidates) != 1:
        raise ValueError("ZIP must contain exactly one data.yaml or data.yml file.")
    yaml_path = yaml_candidates[0]
    try:
        config = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise ValueError("Dataset YAML could not be read.") from exc
    if not isinstance(config, dict):
        raise ValueError("Dataset YAML must contain a mapping.")
    names = config.get("names")
    if isinstance(names, list):
        class_names = [str(name) for name in names]
    elif isinstance(names, dict) and names:
        class_names = [str(names[key]) for key in sorted(names, key=lambda value: int(value))]
    else:
        raise ValueError("Dataset YAML must define class names in 'names'.")
    if not class_names or len(class_names) > 100:
        raise ValueError("Dataset must define between 1 and 100 classes.")

    root = yaml_path.parent.resolve()
    for split in ("train", "val"):
        raw_path = config.get(split)
        if not raw_path:
            raise ValueError(f"Dataset YAML must define '{split}'.")
        paths = raw_path if isinstance(raw_path, list) else [raw_path]
        for raw in paths:
            candidate = (root / str(config.get("path", ".")) / str(raw)).resolve()
            if candidate != root and root not in candidate.parents:
                raise ValueError(f"Dataset '{split}' path escapes the dataset directory.")
            if not candidate.exists():
                raise ValueError(f"Dataset '{split}' path does not exist.")
    config["path"] = str(root)
    config["names"] = class_names
    config["nc"] = len(class_names)
    normalized_yaml = root / "scis-data.yaml"
    normalized_yaml.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")

    image_count = sum(1 for item in target.rglob("*") if item.is_file() and item.suffix.lower() in ALLOWED_IMAGE_SUFFIXES)
    if image_count == 0:
        raise ValueError("No supported images were found in the dataset ZIP.")
    return {"yaml_path": str(normalized_yaml), "classes": class_names, "image_count": image_count}


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    if Path(file.filename or "").suffix.lower() != ".zip":
        await file.close()
        raise HTTPException(status_code=400, detail="Upload a .zip containing a YOLO detection dataset.")
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    dataset_id = uuid.uuid4().hex
    zip_path = DATASET_DIR / f"{dataset_id}.zip"
    target = DATASET_DIR / dataset_id
    try:
        total = 0
        with zip_path.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_DATASET_ZIP_BYTES:
                    raise HTTPException(status_code=413, detail="Dataset ZIP exceeds the 500 MB upload limit.")
                output.write(chunk)
        if total == 0:
            raise HTTPException(status_code=400, detail="Dataset ZIP is empty.")
        target.mkdir(parents=True, exist_ok=False)
        try:
            metadata = await asyncio.to_thread(_safe_extract_and_validate, zip_path, target)
        except (ValueError, zipfile.BadZipFile, OSError) as exc:
            shutil.rmtree(target, ignore_errors=True)
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return {
            "dataset_id": dataset_id,
            "status": "validated",
            "image_count": metadata["image_count"],
            "classes": metadata["classes"],
            "message": "Dataset uploaded and validated. Training has not started.",
            "train_url": f"/datasets/{dataset_id}/train",
        }
    except HTTPException:
        shutil.rmtree(target, ignore_errors=True)
        raise
    finally:
        await file.close()
        zip_path.unlink(missing_ok=True)


def _train_sync(dataset_yaml: Path, output_dir: Path, epochs: int, imgsz: int) -> dict[str, Any]:
    base_model = Path(settings.model_path)
    configured_base = __import__("os").getenv("SCIS_TRAIN_BASE_MODEL", "").strip()
    model_source = configured_base or str(base_model)
    if not configured_base and not base_model.is_file():
        raise FileNotFoundError(
            "Training base weights are missing. Set SCIS_TRAIN_BASE_MODEL to a pretrained YOLO model path."
        )
    trainer = YOLO(model_source)
    result = trainer.train(data=str(dataset_yaml), epochs=epochs, imgsz=imgsz, project=str(output_dir), name="scis")
    best = Path(result.save_dir) / "weights" / "best.pt"
    if not best.is_file():
        raise RuntimeError("Training finished but best.pt was not produced.")
    return {"model_path": str(best), "results_dir": str(result.save_dir)}


@router.post("/{dataset_id}/train")
async def train_dataset(dataset_id: str, epochs: int = 30, imgsz: int = 640) -> dict[str, Any]:
    if not dataset_id.isalnum() or len(dataset_id) != 32:
        raise HTTPException(status_code=400, detail="Invalid dataset ID.")
    if not 1 <= epochs <= MAX_TRAIN_EPOCHS:
        raise HTTPException(status_code=400, detail=f"epochs must be between 1 and {MAX_TRAIN_EPOCHS}.")
    if not 320 <= imgsz <= 1280 or imgsz % 32:
        raise HTTPException(status_code=400, detail="imgsz must be a multiple of 32 between 320 and 1280.")
    dataset_root = (DATASET_DIR / dataset_id).resolve()
    if dataset_root.parent != DATASET_DIR.resolve() or not dataset_root.is_dir():
        raise HTTPException(status_code=404, detail="Validated dataset not found. Upload the ZIP first.")
    yaml_candidates = list(dataset_root.rglob("scis-data.yaml"))
    if len(yaml_candidates) != 1:
        raise HTTPException(status_code=400, detail="Dataset validation metadata is missing; upload the ZIP again.")
    run_dir = TRAINING_DIR / dataset_id
    try:
        result = await asyncio.to_thread(_train_sync, yaml_candidates[0], run_dir, epochs, imgsz)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception:
        logger.exception("Dataset training failed", extra={"dataset_id": dataset_id})
        raise HTTPException(status_code=500, detail="Training failed. Check server logs for details.")
    return {
        "dataset_id": dataset_id,
        "status": "completed",
        "model_path": result["model_path"],
        "results_dir": result["results_dir"],
        "message": "Training completed. Evaluate the weights before using them for canal alerts.",
    }
