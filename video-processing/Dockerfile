# Catalyst AppSail custom runtime: build for Linux AMD64.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    SCIS_MODEL_PATH=/app/models/floating_waste.pt

WORKDIR /app

# OpenCV video decoding/encoding dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
RUN mkdir -p /app/models /app/uploads /app/outputs

# Do not bake private model weights into a public repository or image by default.
# Supply floating_waste.pt through a private build context or a secure model
# delivery process, and set SCIS_MODEL_PATH if its location differs.

EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}"]
