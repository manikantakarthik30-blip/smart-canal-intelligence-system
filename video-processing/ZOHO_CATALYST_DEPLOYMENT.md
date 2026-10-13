# SCIS video processing on Zoho Catalyst

## Recommended layout

- **Frontend:** keep the existing React/Vite dashboard in the current frontend hosting workflow.
- **Video API:** FastAPI + OpenCV + Ultralytics YOLO in a Linux AMD64 OCI container on **Catalyst AppSail custom runtime**. The service listens on `0.0.0.0:$PORT`.
- **Temporary video files:** the current API writes uploads and annotated output to local disk. Treat this as ephemeral scratch space only.
- **Persistent metadata:** use Catalyst Data Store for small job metadata (job ID, timestamps, counts, model version), once an integration is implemented.
- **Persistent media:** do **not** start new work on Catalyst File Store. Zoho announced that File Store is being sunset on **31 October 2026** and is not available for new projects/accounts. Catalyst Stratus is the intended object-storage successor, but it is currently Early Access and Zoho instructs users to contact support to request access. The current code integrates with neither File Store nor Stratus.

Official references:
- AppSail supports custom OCI container runtimes; custom images must target Linux AMD64: https://docs.catalyst.zoho.com/en/serverless/help/appsail/introduction/
- AppSail free allowance: 900 GB-minutes/month, shared at account level; overages can incur a minimum project charge: https://catalyst.zoho.com/free-tier/
- Catalyst free-tier billing details: https://docs.catalyst.zoho.com/en/deployment-and-billing/billing/free-tier/
- File Store sunset / Stratus migration: https://docs.catalyst.zoho.com/en/announcements/2026/filestore-sunset/

## No-card / no-charge rule

Do not switch the Catalyst account to a billing setup that asks for a payment method. Do not claim production hosting is guaranteed to remain free. Catalyst's published free-tier allowances are limited and shared across the account; crossing an allowance can create charges under pay-as-you-go. If the console requires a payment method or production billing activation, stop and remain in the free Development environment/local testing until the account offers a no-card path.

For AppSail, 900 GB-minutes is only 15 hours at 1 GB of allocated memory, before accounting for any other AppSail services on the account. CPU-bound video inference can consume this quickly. Do not run continuous CCTV inference on the free allowance. Use short, manually uploaded test clips and check Catalyst usage before each test. Keep usage within the published limits; no-card means stop rather than enable billing if a limit is near.

## Model requirements (manual step)

The repository does **not** include model weights. The API will start and `GET /health` will respond if the model is missing, but `POST /analyze` returns HTTP 503 until a compatible model is installed.

Provide a YOLO model trained and validated for these target classes:
- plastic bags
- plastic bottles
- floating debris
- other visible waste
- organic waste
- foam

A generic COCO model is not a substitute for a canal-waste model. Check the model's class names and licence. The current backend reports the class names embedded in the model; it does not remap labels automatically. The model file must be accessible at `SCIS_MODEL_PATH` (default in the container: `/app/models/floating_waste.pt`). Keep weights private and out of Git. A lightweight CPU-compatible model is preferred; GPU inference is not assumed.

## Local test before any cloud deployment

From the repository root, in PowerShell:

```powershell
cd video-processing
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SCIS_MODEL_PATH="C:\path\to\floating_waste.pt"
$env:SCIS_FRAME_STRIDE="5"
$env:SCIS_CORS_ORIGINS="http://localhost:8080,http://127.0.0.1:8080"
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health`; require `model_ready: true`. Test a short clip using `http://127.0.0.1:8000/docs`. Then run frontend and set `VITE_VIDEO_API_URL=http://127.0.0.1:8000` in its local environment file.

## AppSail container build/deploy (manual)

1. Install Docker and the Zoho Catalyst CLI; sign in to Catalyst.
2. Confirm the project/environment and its billing mode in the Catalyst console. Do not add a card or enable a paid plan.
3. Build the image for Linux AMD64 from `video-processing/`. The default Docker build intentionally excludes model weights:
   `docker build --platform linux/amd64 -t scis-video-api:dev .`
4. For real inference, provide the licensed model through a private build context or secure model delivery. Do not commit weights to Git. Confirm the final image contains the model and `SCIS_MODEL_PATH` points to it.
5. Deploy the OCI image to AppSail using the Catalyst CLI/console workflow documented for the installed CLI version. Use the container port configured by `PORT` (default 8080). If the console requires payment setup or does not offer a no-card deployment path, stop here and use local testing.
6. Check `/health`. It must return `model_ready: true`; otherwise do not connect the dashboard.
7. Set the frontend build variable `VITE_VIDEO_API_URL` to the public AppSail service URL and set `SCIS_CORS_ORIGINS` to the exact deployed frontend origin. Rebuild/redeploy the frontend.
8. Upload only a short, non-sensitive clip. Check Catalyst usage and confirm the annotated video can be retrieved. The output URL is temporary and can stop working after restart/redeployment.

## Known implementation gaps

- No Catalyst Data Store or Stratus integration is implemented yet.
- Local output files are not durable and are not suitable for long-term result links.
- The endpoint is synchronous and does not have authentication, a job queue, or rate limiting.
- Counts are detections across sampled frames, not unique physical objects; tracking is not implemented.
- No trained model, real canal footage, cloud deployment, or end-to-end test has been verified.
- AppSail's free allowance is not a guarantee that heavy YOLO inference will fit. Prefer CPU-light models, short clips, frame stride 5 or higher, and low resolution. Do not promise live/continuous CCTV on this architecture.
