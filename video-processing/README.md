# SCIS Video Processing Service

This service adds real frame-by-frame computer-vision inference to the Smart Canal Intelligence System frontend.

## Prerequisites

- Python 3.10 or newer (use a version supported by the installed Ultralytics release).
- A compatible YOLO model trained for floating waste. The repository intentionally does not include model weights.
- The model's licence must be compatible with your use.

Place the weights at `models/floating_waste.pt`, or set `SCIS_MODEL_PATH` to another local path. Do not rename a generic object-detection model and assume it can detect canal waste classes.

## Install on Windows PowerShell

From the repository root:

```powershell
cd video-processing
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` to test the API. `GET /health` reports whether model weights are present.

## Frontend

Run the existing frontend on port 8080. By default, the upload panel calls `http://127.0.0.1:8000`. Set `VITE_VIDEO_API_URL` to the deployed service URL for a deployed frontend, and set `SCIS_CORS_ORIGINS` on the API to a comma-separated list of exact allowed frontend origins.

## Settings

- `SCIS_MODEL_PATH`: path to the compatible model weights.
- `SCIS_FRAME_STRIDE`: analyze every Nth frame (default 3).
- `SCIS_CONFIDENCE`: detector confidence threshold (default 0.25).
- `SCIS_CORS_ORIGINS`: allowed frontend origins.

## Current MVP limitations

- The endpoint processes synchronously; large or slow videos can exceed hosting request timeouts.
- Output files remain on local disk until manually removed. Ephemeral hosting filesystems are not durable.
- Detections are counts across sampled frames, not unique physical objects. Add object tracking for unique-item estimates.
- The sampled frames have bounding boxes; unsampled frames are copied without boxes.
- Authentication, job queueing, persistent result storage and rate limiting are not yet implemented.
- Validate inference quality on labelled canal footage before using results for official alerts or reports.
