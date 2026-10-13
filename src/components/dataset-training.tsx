import { useState } from "react";

type DatasetUploadResult = {
  dataset_id: string;
  status: string;
  image_count: number;
  classes: string[];
  message: string;
  train_url: string;
};

type TrainingResult = {
  dataset_id: string;
  status: string;
  model_path: string;
  results_dir: string;
  message: string;
};

const configuredApi = import.meta.env.VITE_VIDEO_API_URL?.trim().replace(/\/$/, "");
const API_BASE = configuredApi || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");
const MAX_ZIP_BYTES = 500 * 1024 * 1024;

export function DatasetTraining() {
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetUploadResult | null>(null);
  const [training, setTraining] = useState<TrainingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [epochs, setEpochs] = useState(30);

  async function uploadDataset() {
    if (!file || busy || !API_BASE) return;
    setBusy(true);
    setError("");
    setDataset(null);
    setTraining(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE}/datasets/upload`, { method: "POST", body });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || `Dataset upload failed (HTTP ${response.status}).`);
      setDataset(payload as DatasetUploadResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dataset upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function startTraining() {
    if (!dataset || busy || !API_BASE) return;
    setBusy(true);
    setError("");
    setTraining(null);
    try {
      const response = await fetch(
        `${API_BASE}/datasets/${encodeURIComponent(dataset.dataset_id)}/train?epochs=${epochs}&imgsz=640`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || `Training failed (HTTP ${response.status}).`);
      setTraining(payload as TrainingResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Model training failed.");
    } finally {
      setBusy(false);
    }
  }

  function chooseFile(selected: File | undefined) {
    setFile(null);
    setDataset(null);
    setTraining(null);
    setError("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setError("Choose a ZIP file containing a YOLO detection dataset.");
      return;
    }
    if (selected.size > MAX_ZIP_BYTES) {
      setError("Dataset ZIP exceeds the 500 MB upload limit.");
      return;
    }
    setFile(selected);
  }

  return (
    <section id="dataset-training" className="feed reveal" aria-labelledby="dataset-training-title">
      <div className="feed-inner">
        <header className="feed-head">
          <p className="feed-kicker">Model Development · YOLO</p>
          <h2 id="dataset-training-title" className="feed-title">Dataset Upload & Model Training</h2>
          <p className="feed-sub">
            This is a separate workflow from video analysis. Upload a labeled YOLO dataset ZIP, validate its
            structure, then explicitly start training. Uploading a dataset does not train a model automatically.
          </p>
        </header>

        {!API_BASE ? (
          <div className="metric-card"><p role="status" className="metric-meta">
            Dataset training is disabled for this deployment. Configure VITE_VIDEO_API_URL with the Python service URL.
          </p></div>
        ) : (
          <div className="metric-card" style={{ display: "grid", gap: 16 }}>
            <p className="metric-meta">
              ZIP must contain exactly one data.yaml/data.yml, labeled images, matching YOLO label text files,
              and train/val paths defined in the YAML. ZIP upload limit: 500 MB. Training requires compatible
              base YOLO weights and enough CPU/RAM; do not use this endpoint on an untrusted public service.
            </p>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="metric-label">Select labeled dataset (.zip)</span>
              <input type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => chooseFile(event.target.files?.[0])} />
            </label>
            {file && <p className="metric-meta">{file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
            <button type="button" className="report-go" disabled={!file || busy} onClick={uploadDataset}>
              {busy ? "Uploading / validating…" : "Upload and validate dataset"}
            </button>

            {dataset && (
              <div role="status" style={{ display: "grid", gap: 8 }}>
                <h3>Dataset validated</h3>
                <p className="metric-meta">Images found: {dataset.image_count}</p>
                <p className="metric-meta">Classes: {dataset.classes.join(", ")}</p>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="metric-label">Training epochs (1–100)</span>
                  <input type="number" min={1} max={100} value={epochs} disabled={busy} onChange={(event) => setEpochs(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} />
                </label>
                <button type="button" className="report-go" disabled={busy} onClick={startTraining}>
                  {busy ? "Training model…" : "Start model training"}
                </button>
              </div>
            )}
            {busy && dataset && <p role="status" className="metric-meta">Training can take several minutes or longer. Keep this tab open.</p>}
            {error && <p role="alert" style={{ color: "#ff6b6b" }}>{error}</p>}
            {training && (
              <div role="status" style={{ display: "grid", gap: 8 }}>
                <h3>Training completed</h3>
                <p className="metric-meta">{training.message}</p>
                <p className="metric-meta">Weights: {training.model_path}</p>
                <p className="metric-meta">Results: {training.results_dir}</p>
                <p className="metric-meta">
                  These weights are stored on the backend filesystem. They are not automatically activated as the
                  inference model and may be lost on ephemeral hosting. Evaluate them and configure SCIS_MODEL_PATH explicitly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
