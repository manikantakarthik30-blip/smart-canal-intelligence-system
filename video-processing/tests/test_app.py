import time
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app as video_app


class FakePrediction:
    boxes = None
    names = {}

    def plot(self):
        return "annotated-frame"


class FakeModel:
    def predict(self, source, conf, verbose):
        return [FakePrediction()]


class FailingModel:
    def predict(self, source, conf, verbose):
        raise RuntimeError("internal failure at /tmp/secret-model")


class FakeCapture:
    def __init__(self, path: str, frame_count: int = 1):
        self._frame_count = frame_count
        self._index = 0

    def isOpened(self):
        return True

    def get(self, prop):
        if prop == 1:
            return 30.0
        if prop == 2:
            return 640
        if prop == 3:
            return 360
        return 0

    def read(self):
        if self._index >= self._frame_count:
            return False, None
        self._index += 1
        return True, {"frame": self._index}

    def release(self):
        return None


class FakeWriter:
    def __init__(self, path: str, *_args):
        self.path = Path(path)
        self.path.write_bytes(b"")

    def isOpened(self):
        return True

    def write(self, frame):
        with self.path.open("ab") as fp:
            fp.write(b"1")

    def release(self):
        return None


@pytest.fixture()
def client():
    with TestClient(video_app.app) as test_client:
        yield test_client


@pytest.fixture()
def runtime(tmp_path, monkeypatch):
    upload_dir = tmp_path / "uploads"
    output_dir = tmp_path / "outputs"
    upload_dir.mkdir()
    output_dir.mkdir()

    new_settings = replace(
        video_app.settings,
        upload_dir=upload_dir,
        output_dir=output_dir,
        max_upload_bytes=100 * 1024,
        output_retention_seconds=60,
        output_cleanup_interval_seconds=1,
        output_cleanup_enabled=True,
    )
    monkeypatch.setattr(video_app, "settings", new_settings)
    monkeypatch.setattr(
        video_app,
        "output_lifecycle",
        video_app.OutputLifecycleManager(
            output_dir=output_dir,
            retention_seconds=new_settings.output_retention_seconds,
            cleanup_interval_seconds=new_settings.output_cleanup_interval_seconds,
            cleanup_enabled=new_settings.output_cleanup_enabled,
        ),
    )

    fake_cv2 = SimpleNamespace(
        CAP_PROP_FPS=1,
        CAP_PROP_FRAME_WIDTH=2,
        CAP_PROP_FRAME_HEIGHT=3,
        VideoCapture=lambda path: FakeCapture(path, frame_count=1),
        VideoWriter=lambda path, fourcc, fps, size: FakeWriter(path, fourcc, fps, size),
        VideoWriter_fourcc=lambda *args: 0,
    )
    monkeypatch.setattr(video_app, "cv2", fake_cv2)

    return new_settings


def test_health_with_missing_model_weights(runtime, monkeypatch, client, tmp_path):
    missing_weights = tmp_path / "missing.pt"
    monkeypatch.setattr(video_app, "settings", replace(video_app.settings, model_path=missing_weights))
    video_app.load_model()

    response = client.get("/health")
    body = response.json()

    assert response.status_code == 200
    assert body["model_ready"] is False
    assert body["model_configured"] is False
    assert body["model_error"] == "Model weights file is missing."


def test_analyze_returns_503_when_model_not_ready(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", None)
    monkeypatch.setattr(video_app, "model_load_error", "Model weights file is missing.")

    response = client.post(
        "/analyze",
        files={"file": ("sample.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 503
    assert "Detection model is not loaded" in response.json()["detail"]


def test_rejects_invalid_file_type(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FakeModel())

    response = client.post(
        "/analyze",
        files={"file": ("bad.txt", b"abc", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported format. Use MP4, MOV, AVI or MKV."


def test_rejects_empty_video(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FakeModel())

    response = client.post(
        "/analyze",
        files={"file": ("empty.mp4", b"", "video/mp4")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded video is empty."


def test_rejects_oversized_upload(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FakeModel())
    monkeypatch.setattr(video_app, "settings", replace(video_app.settings, max_upload_bytes=4))

    response = client.post(
        "/analyze",
        files={"file": ("big.mp4", b"12345", "video/mp4")},
    )

    assert response.status_code == 413
    assert "upload limit" in response.json()["detail"]


def test_cleanup_retention_skips_recent_and_deletes_old(runtime):
    old_file = runtime.output_dir / "old_annotated.mp4"
    new_file = runtime.output_dir / "new_annotated.mp4"
    old_file.write_bytes(b"old")
    new_file.write_bytes(b"new")

    now = time.time()
    old_age = now - 120
    new_age = now - 2
    old_file.touch()
    new_file.touch()
    import os

    os.utime(old_file, (old_age, old_age))
    os.utime(new_file, (new_age, new_age))

    runtime_manager = video_app.OutputLifecycleManager(
        output_dir=runtime.output_dir,
        retention_seconds=60,
        cleanup_interval_seconds=1,
        cleanup_enabled=True,
    )

    removed = runtime_manager.run_cleanup(force=True, now=now)
    assert "old_annotated.mp4" in removed
    assert old_file.exists() is False
    assert new_file.exists() is True


def test_cleanup_protects_active_outputs(runtime):
    output_file = runtime.output_dir / "active_annotated.mp4"
    output_file.write_bytes(b"busy")
    old_timestamp = time.time() - 600
    import os

    os.utime(output_file, (old_timestamp, old_timestamp))

    manager = video_app.OutputLifecycleManager(
        output_dir=runtime.output_dir,
        retention_seconds=1,
        cleanup_interval_seconds=1,
        cleanup_enabled=True,
    )

    manager.activate(output_file)
    first_removed = manager.run_cleanup(force=True, now=time.time())
    assert first_removed == []
    assert output_file.exists() is True

    manager.deactivate(output_file)
    second_removed = manager.run_cleanup(force=True, now=time.time())
    assert output_file.name in second_removed
    assert output_file.exists() is False


def test_inference_errors_return_sanitized_500(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FailingModel())

    response = client.post(
        "/analyze",
        files={"file": ("sample.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 500
    detail = response.json()["detail"]
    assert "Video processing failed. Reference" in detail
    assert "secret-model" not in detail
    assert "/tmp/" not in detail
    assert not list(runtime.output_dir.glob("*_annotated.mp4"))


def test_analyze_uses_worker_thread_dispatch(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FakeModel())
    called = {"to_thread": False}

    async def fake_to_thread(func, *args, **kwargs):
        called["to_thread"] = True
        return func(*args, **kwargs)

    monkeypatch.setattr(video_app.asyncio, "to_thread", fake_to_thread)

    response = client.post(
        "/analyze",
        files={"file": ("sample.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 200
    assert called["to_thread"] is True


def test_new_output_not_cleaned_immediately(runtime, monkeypatch, client):
    monkeypatch.setattr(video_app, "model", FakeModel())
    monkeypatch.setattr(video_app, "settings", replace(video_app.settings, output_retention_seconds=600))
    monkeypatch.setattr(
        video_app,
        "output_lifecycle",
        video_app.OutputLifecycleManager(
            output_dir=runtime.output_dir,
            retention_seconds=600,
            cleanup_interval_seconds=1,
            cleanup_enabled=True,
        ),
    )

    response = client.post(
        "/analyze",
        files={"file": ("sample.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 200
    output_name = Path(response.json()["annotated_video_url"]).name
    assert (runtime.output_dir / output_name).exists() is True


@pytest.mark.parametrize(
    "bad_env,expected",
    [
        ({"SCIS_FRAME_STRIDE": "0"}, "SCIS_FRAME_STRIDE must be >= 1."),
        ({"SCIS_CONFIDENCE": "abc"}, "SCIS_CONFIDENCE must be a number."),
        ({"SCIS_CONFIDENCE": "1.1"}, "SCIS_CONFIDENCE must be <= 1.0."),
        ({"SCIS_MAX_UPLOAD_BYTES": "-1"}, "SCIS_MAX_UPLOAD_BYTES must be >= 1."),
        ({"SCIS_OUTPUT_RETENTION_SECONDS": "0"}, "SCIS_OUTPUT_RETENTION_SECONDS must be >= 1."),
        ({"SCIS_OUTPUT_CLEANUP_INTERVAL_SECONDS": "0"}, "SCIS_OUTPUT_CLEANUP_INTERVAL_SECONDS must be >= 1."),
        ({"SCIS_CORS_ORIGINS": "notaurl"}, "invalid origin"),
        ({"SCIS_MODEL_PATH": "   "}, "SCIS_MODEL_PATH must be a non-empty path."),
    ],
)
def test_settings_validation_errors(bad_env, expected):
    with pytest.raises(video_app.ConfigError, match=expected):
        video_app.Settings.from_env(bad_env)
