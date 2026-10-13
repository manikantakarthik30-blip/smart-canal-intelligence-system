# SCIS Video Processing Service

This service adds frame-sampled computer-vision inference to the Smart Canal Intelligence System frontend.

## Prerequisites

- Python 3.10 or newer (use a version supported by the installed Ultralytics release).
- A compatible YOLO model trained and validated for floating canal waste.
- A model licence compatible with your use. Keep private weights out of Git.

Place the weights at `models/floating_waste.pt`, or set `SCIS_MODEL_PATH` to another local path. A generic object-detection model is not guaranteed to recognize canal waste classes.

## Install on Windows PowerShell

From the repository root:

```powershell
cd video-processing
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SCIS_MODEL_PATH="C:\path\to\floating_waste.pt"
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` to test the API. `GET /health` must report `model_ready: true` before `POST /analyze` will work.

## Frontend

Run the existing frontend on port 8080. For local development, the panel defaults to `http://127.0.0.1:8000`. For a deployed frontend, set `VITE_VIDEO_API_URL` to the public API URL at build time and set `SCIS_CORS_ORIGINS` on the API to the exact frontend origin(s).

## Zoho Catalyst

See [ZOHO_CATALYST_DEPLOYMENT.md](./ZOHO_CATALYST_DEPLOYMENT.md) for the AppSail container layout, no-card billing guardrails, model requirements, deployment steps, and current gaps. The added Dockerfile targets Catalyst AppSail custom runtime; it does not bundle model weights.

## Settings

- `SCIS_MODEL_PATH`: path to the compatible model weights.
- `SCIS_FRAME_STRIDE`: analyze every Nth frame (default 3; larger values reduce CPU usage).
- `SCIS_CONFIDENCE`: detector confidence threshold (default 0.25).
- `SCIS_CORS_ORIGINS`: comma-separated allowed frontend origins.
- `PORT`: HTTP port supplied by the hosting platform (container default 8080).

## Current MVP limitations

- The endpoint processes synchronously; large or slow videos can exceed hosting request timeouts.
- Uploads are removed after processing, but annotated outputs remain on local disk temporarily. Ephemeral hosting filesystems are not durable.
- No Catalyst Data Store/File Store integration is implemented yet.
- Detections are counts across sampled frames, not unique physical objects. Add object tracking for unique-item estimates.
- Sampled frames have bounding boxes; unsampled frames are copied without boxes.
- Authentication, job queueing, persistent result storage and rate limiting are not yet implemented.
- No trained model, real canal test video, cloud deployment, or end-to-end test has been verified. Validate on labelled canal footage before using results for official alerts or reports.
