import { useState } from "react";

type Detection = {
  frame: number;
  timestamp_seconds: number;
  class: string;
  confidence: number;
  box_xyxy: number[];
};

type AnalysisResult = {
  job_id: string;
  frames_processed: number;
  frames_analyzed: number;
  total_detections: number;
  fps: number;
  width: number;
  height: number;
  sampled_frame_detections: Record<string, number>;
  detections: Detection[];
  annotated_video_url: string;
  note: string;
};

const configuredApi = import.meta.env.VITE_VIDEO_API_URL?.trim().replace(/\/$/, "");
const API_BASE = configuredApi || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".mkv"]);

export function VideoAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!file || busy || !API_BASE) return;
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE}/analyze`, { method: "POST", body });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || `Video analysis failed (HTTP ${response.status}).`);
      }
      setResult((await response.json()) as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  function selectFile(selected: File | undefined) {
    setResult(null);
    setError("");
    if (!selected) {
      setFile(null);
      return;
    }
    const extension = selected.name.includes(".")
      ? `.${selected.name.split(".").pop()?.toLowerCase()}`
      : "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setFile(null);
      setError("Unsupported video format. Choose MP4, MOV, AVI or MKV.");
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setError("Video exceeds the 100 MB upload limit.");
      return;
    }
    setFile(selected);
  }

  return (
    <section id="video-analysis" className="feed reveal" aria-labelledby="video-analysis-title">
      <div className="feed-inner">
        <header className="feed-head">
          <p className="feed-kicker">Computer Vision · OpenCV + YOLO</p>
          <h2 id="video-analysis-title" className="feed-title">Canal Video Analysis</h2>
          <p className="feed-sub">
            Upload recorded canal footage to detect waste, inspect frame-level evidence and view an annotated video.
            This panel uses the configured model service, not the existing demo image heuristic.
          </p>
        </header>

        {!API_BASE ? (
          <div className="metric-card">
            <p role="status" className="metric-meta">
              Video analysis is not enabled for this deployment yet. The upload controls are hidden until
              VITE_VIDEO_API_URL is configured with the public URL of the deployed Python analysis service.
            </p>
          </div>
        ) : (
          <div className="metric-card" style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="metric-label">Select canal footage (MP4, MOV, AVI or MKV; maximum 100 MB)</span>
              <input
                type="file"
                accept=".mp4,.mov,.avi,.mkv,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                disabled={busy}
                onChange={(event) => selectFile(event.target.files?.[0])}
              />
            </label>
            {file && <p className="metric-meta">{file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
            <button type="button" className="report-go" disabled={!file || busy} onClick={analyze}>
              {busy ? "Processing video…" : "Analyze canal video"}
            </button>
            {busy && <p role="status" className="metric-meta">Processing can take time depending on video length and available hardware. Keep this tab open.</p>}
            {error && <p role="alert" style={{ color: "#ff6b6b" }}>{error}</p>}
          </div>
        )}

        {result && (
          <div className="metric-card" style={{ display: "grid", gap: 16, marginTop: 20 }}>
            <h3>Analysis result</h3>
            <div className="dash-grid">
              <article className="metric-card">
                <p className="metric-label">Frames processed</p>
                <p className="metric-value metric-green">{result.frames_processed}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Frames analyzed</p>
                <p className="metric-value metric-cyan">{result.frames_analyzed}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Detections in sampled frames</p>
                <p className="metric-value metric-orange">{result.total_detections ?? Object.values(result.sampled_frame_detections).reduce((sum, count) => sum + count, 0)}</p>
              </article>
            </div>

            <h4>Detected classes (sampled frames)</h4>
            {Object.keys(result.sampled_frame_detections).length === 0 ? (
              <p className="metric-meta">No objects were detected in the sampled frames. This does not prove the canal is waste-free.</p>
            ) : (
              <ul>
                {Object.entries(result.sampled_frame_detections).map(([label, count]) => (
                  <li key={label}>{label}: {count}</li>
                ))}
              </ul>
            )}

            <video
              controls
              preload="metadata"
              src={`${API_BASE}${result.annotated_video_url}`}
              style={{ display: "block", width: "100%", maxHeight: 560, background: "#000" }}
            />
            <p className="metric-meta">{result.note}</p>

            <div style={{ overflowX: "auto" }}>
              <h4>Detection evidence (first 100 rows)</h4>
              <table className="log-table">
                <thead><tr><th>Time (s)</th><th>Frame</th><th>Class</th><th>Confidence</th></tr></thead>
                <tbody>
                  {result.detections.slice(0, 100).map((d, index) => (
                    <tr key={`${d.frame}-${index}`}>
                      <td>{d.timestamp_seconds.toFixed(2)}</td>
                      <td>{d.frame}</td>
                      <td>{d.class}</td>
                      <td>{(d.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
