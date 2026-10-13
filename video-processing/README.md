# SCIS Video Processing Service

This service adds frame-sampled computer-vision inference to the Smart Canal Intelligence System frontend.

## Prerequisites

- Python 3.10+
- A compatible YOLO model trained and validated for floating canal waste
- A model licence compatible with your use (keep private weights out of Git)

Place weights at `models/floating_waste.pt` or set `SCIS_MODEL_PATH`.

> Missing model weights are non-fatal: the API still boots, `GET /health` reports `model_ready: false`, and `POST /analyze` returns HTTP 503.

## Install and run locally

From repository root:

```bash
cd video-processing
python -m venv .venv
source .venv/bin/activate   # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
export SCIS_MODEL_PATH="/absolute/path/to/floating_waste.pt"
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Open `http://127.0.0.1:8000/docs`.

## Environment variables and validation

All values are validated at import/startup. Invalid values fail startup with a clear configuration error.

- `SCIS_MODEL_PATH` (default: `video-processing/models/floating_waste.pt`)
  - Must be a non-empty path
  - File may be missing (service still starts with model not ready)
- `SCIS_FRAME_STRIDE` (default: `3`)
  - Integer, must be `>= 1`
- `SCIS_CONFIDENCE` (default: `0.25`)
  - Number in range `[0.0, 1.0]`
- `SCIS_MAX_UPLOAD_BYTES` (default: `104857600`)
  - Integer, must be `>= 1`
- `SCIS_CORS_ORIGINS` (default: `http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173`)
  - Comma-separated non-empty HTTP/HTTPS origins
- `SCIS_OUTPUT_RETENTION_SECONDS` (default: `3600`)
  - Integer, must be `>= 1`
- `SCIS_OUTPUT_CLEANUP_INTERVAL_SECONDS` (default: `300`)
  - Integer, must be `>= 1`
- `SCIS_OUTPUT_CLEANUP_ENABLED` (default: `true`)
  - Boolean: `true/false`, `1/0`, `yes/no`, `on/off`
- `SCIS_UPLOAD_DIR` (optional)
  - Local upload temp directory override
- `SCIS_OUTPUT_DIR` (optional)
  - Local annotated output directory override

## Output retention and cleanup behavior

Annotated files are written to `outputs/` and served via `/video/{filename}`.

- Cleanup is managed by a lifecycle registry with locking.
- Active files are tracked while:
  - a file is being generated (`/analyze` processing), or
  - a file is being served (`/video/{filename}` response)
- Cleanup never deletes active files.
- Cleanup removes only `*_annotated.mp4` files older than `SCIS_OUTPUT_RETENTION_SECONDS`.
- Cleanup runs opportunistically on analyze requests, at most once per `SCIS_OUTPUT_CLEANUP_INTERVAL_SECONDS`.

## API and error-handling notes

The API contract is preserved:

- `GET /health`
- `POST /analyze`
- `GET /video/{filename}`

Behavior updates:

- `POST /analyze` now adds `request_id` in successful JSON responses for observability.
- Internal exceptions are logged server-side with request/job IDs and stack traces.
- Clients receive sanitized HTTP 500 messages with reference IDs (no raw stack traces or internal paths).

## Frontend integration

Run the existing frontend on port 8080. Local panel defaults to `http://127.0.0.1:8000`. For deployed frontend use `VITE_VIDEO_API_URL` and configure `SCIS_CORS_ORIGINS` to exact frontend origins.

## Tests

Install test dependencies and run pytest:

```bash
cd video-processing
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-test.txt
pytest -q
```

Current automated tests cover:

- health checks when model weights are missing
- missing model behavior (`/analyze` returns 503)
- invalid file type rejection
- empty video rejection
- oversize upload rejection
- output retention cleanup
- protection against deleting active output files
- inference exception sanitization (safe 500)
- configuration validation
- worker-thread dispatch for inference (`asyncio.to_thread` path)

## Zoho Catalyst

See [ZOHO_CATALYST_DEPLOYMENT.md](./ZOHO_CATALYST_DEPLOYMENT.md) for AppSail deployment notes and constraints. The Docker image does not bundle model weights.

## Separate dataset upload and training workflow

The dashboard has a separate **Dataset Upload & Model Training** panel. It does not use the video-analysis upload control and uploading a dataset never starts training automatically.

### Accepted dataset ZIP

- ZIP maximum: 500 MB; extracted contents maximum: 2 GB; maximum 20,000 files.
- Include exactly one `data.yaml` or `data.yml`, labeled images, and YOLO detection label text files.
- YAML must define `names`, `train`, and `val` paths. The train/validation paths must exist inside the extracted dataset directory.
- Supported image formats: JPG, JPEG, PNG, BMP, WEBP.
- Use a standard YOLO object-detection layout. Example:

```text
my-dataset.zip
  data.yaml
  images/
    train/*.jpg
    val/*.jpg
  labels/
    train/*.txt
    val/*.txt
```

Your `data.yaml` should use paths relative to its directory, for example `train: images/train`, `val: images/val`, and `names: [plastic_bottle, plastic_bag, floating_debris]`. Class names must match the actual annotations; do not add classes that are not labeled.

### Workflow and endpoints

1. Start the API and open `http://127.0.0.1:8000/docs`.
2. Use `POST /datasets/upload` to upload and validate the ZIP. The response returns a dataset ID, image count, and class names.
3. Explicitly call `POST /datasets/{dataset_id}/train?epochs=30&imgsz=640` to start training.
4. Training writes `best.pt` under `video-processing/training-runs/<dataset_id>/scis/weights/best.pt` (exact run path is returned by the API).
5. Evaluate the trained weights on held-out canal footage before configuring `SCIS_MODEL_PATH`. Training does not automatically replace the inference model.

Set `SCIS_TRAIN_BASE_MODEL` to a local pretrained YOLO checkpoint if you do not want Ultralytics to download a base checkpoint. Training can consume substantial CPU, memory, disk and time; it is not a background job queue and should not be exposed to an untrusted public user. Use local development or a protected environment only. Uploaded datasets and trained weights are local filesystem artifacts and may be lost on ephemeral hosting. Keep them out of Git.
