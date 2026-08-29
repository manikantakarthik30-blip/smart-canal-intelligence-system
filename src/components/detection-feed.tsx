import { useEffect, useId, useRef, useState } from "react";
import { detectWaste, trackHits, type WasteHit } from "@/lib/waste-detect";

const OBJECTS = ["Plastic Waste", "Debris", "Garbage Bag"] as const;

const FLOW = "/flow/";
const WM = "https://upload.wikimedia.org/wikipedia/commons/";

const WATER_URLS = [
  `${FLOW}scene1.gif`,
  `${WM}thumb/c/c2/Eluru_canal_and_National_Highway_16_near_Denduluru.jpg/1280px-Eluru_canal_and_National_Highway_16_near_Denduluru.jpg`,
  `${WM}thumb/f/f6/A_canal_of_river_Krishna.jpg/1280px-A_canal_of_river_Krishna.jpg`,
  `${FLOW}scene2.gif`,
  `${WM}thumb/a/a6/River_Krishna_in_full_flow_at_Vijayawada.jpg/1280px-River_Krishna_in_full_flow_at_Vijayawada.jpg`,
  `${WM}thumb/c/c5/Krishna_River_and_Prakasham_barrage_at_Krishna_ghat.jpg/1280px-Krishna_River_and_Prakasham_barrage_at_Krishna_ghat.jpg`,
  `${FLOW}scene3.gif`,
  `${WM}thumb/e/e0/Krishna_river_at_Vijayawada.jpg/1280px-Krishna_river_at_Vijayawada.jpg`,
  `${WM}thumb/9/98/Aerial_view_of_National_Highway_16_and_Eluru_canal_near_Denduluru.jpg/1280px-Aerial_view_of_National_Highway_16_and_Eluru_canal_near_Denduluru.jpg`,
  `${WM}thumb/a/a4/Krishna_river_canal.jpg/1280px-Krishna_river_canal.jpg`,
  `${WM}5/5b/River_litter_plastic_fragments_1.jpg`,
  `${WM}thumb/2/24/Water-pollution.jpg/1280px-Water-pollution.jpg`,
  `${WM}thumb/3/3a/Fishing_boat_near_Prakasam_barrage.jpg/1280px-Fishing_boat_near_Prakasam_barrage.jpg`,
  `${WM}thumb/c/cb/Krishna_nadi_at_vijayavada.jpg/1280px-Krishna_nadi_at_vijayavada.jpg`,
  `${WM}thumb/b/b2/Krishna_river_bank.jpg/1280px-Krishna_river_bank.jpg`,
  `${WM}thumb/3/3b/View_of_Krishna_River_while_boating.jpg/1280px-View_of_Krishna_River_while_boating.jpg`,
  `${WM}thumb/2/20/Railway_bridges_on_Krishna_near_Vijayawada_IMG20191107114614.jpg/1280px-Railway_bridges_on_Krishna_near_Vijayawada_IMG20191107114614.jpg`,
  `${WM}3/33/River_Krishna_View_at_Vijayawada_City.jpg`,
  `${WM}thumb/4/49/Krishna_River%2C_Andhra_Pradesh%2C_India_%282017%29.jpg/1280px-Krishna_River%2C_Andhra_Pradesh%2C_India_%282017%29.jpg`,
  `${WM}thumb/7/7d/Traditional_Fishing_Boat_on_Indian_River.jpg/1280px-Traditional_Fishing_Boat_on_Indian_River.jpg`,
  `${WM}thumb/2/20/Canal_Road_in_Vijayawada.JPG/1280px-Canal_Road_in_Vijayawada.JPG`,
  `${WM}4/4f/Grand_Union_Canal%2C_Paddington_Branch_%28geograph_3206364%29.jpg`,
  `${WM}thumb/e/ea/Krishna_River_and_bridge_at_Vijayawada.jpg/1280px-Krishna_River_and_bridge_at_Vijayawada.jpg`,
  `${WM}thumb/2/25/Krishna_River_near_Vijayawada_Andhra_Pradesh_India.jpg/1280px-Krishna_River_near_Vijayawada_Andhra_Pradesh_India.jpg`,
];

const CAMERAS = [
  { id: "CAM-01", location: "Eluru Canal, Governorpet Reach", startCount: 41, offset: 0, delay: 0 },
  { id: "CAM-02", location: "Ryves Canal, One Town", startCount: 28, offset: 3, delay: 400 },
  { id: "CAM-03", location: "Eluru Canal, Bhavanipuram Bund", startCount: 36, offset: 6, delay: 800 },
] as const;

type ObjectType = (typeof OBJECTS)[number];

type Tracked = WasteHit & { id: number; misses: number };

type LogRow = {
  key: number;
  time: string;
  camera: string;
  object: ObjectType;
  confidence: string;
  location: string;
  frame: string;
};

function istTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function frameName(url: string) {
  const file = decodeURIComponent((url.split("?")[0].split("/").pop() ?? "frame.jpg"));
  return file.replace(/^1280px-/, "").slice(0, 48);
}

function holdMs(url: string, reduced: boolean) {
  const gif = url.includes(".gif");
  if (gif) return reduced ? 14000 : 10000;
  return reduced ? 3200 : 2500;
}

const INITIAL_LOG: LogRow[] = [
  {
    key: 5,
    time: "15:32:18",
    camera: "CAM-02",
    object: "Plastic Waste",
    confidence: "91.3%",
    location: "Ryves Canal, One Town",
    frame: "scene2.gif",
  },
  {
    key: 4,
    time: "15:31:52",
    camera: "CAM-01",
    object: "Debris",
    confidence: "87.6%",
    location: "Eluru Canal, Governorpet Reach",
    frame: "Eluru_canal_Denduluru.jpg",
  },
  {
    key: 3,
    time: "15:31:19",
    camera: "CAM-03",
    object: "Garbage Bag",
    confidence: "94.2%",
    location: "Eluru Canal, Bhavanipuram Bund",
    frame: "scene3.gif",
  },
  {
    key: 2,
    time: "15:30:47",
    camera: "CAM-01",
    object: "Plastic Waste",
    confidence: "96.1%",
    location: "Eluru Canal, Governorpet Reach",
    frame: "scene1.gif",
  },
  {
    key: 1,
    time: "15:30:11",
    camera: "CAM-02",
    object: "Debris",
    confidence: "88.4%",
    location: "Ryves Canal, One Town",
    frame: "Krishna_river_canal.jpg",
  },
];

function CameraCard({
  camera,
  now,
  reduced,
  onFrame,
  onHit,
}: {
  camera: (typeof CAMERAS)[number];
  now: Date | null;
  reduced: boolean;
  onFrame: (url: string) => void;
  onHit: (hit: { object: ObjectType; conf: string; frame: string }) => void;
}) {
  const [boxes, setBoxes] = useState<Tracked[]>([]);
  const [objects, setObjects] = useState<number>(camera.startCount);
  const [index, setIndex] = useState(camera.offset % WATER_URLS.length);
  const [armed, setArmed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const idRef = useRef({ n: camera.startCount });
  const boxesRef = useRef<Tracked[]>([]);
  const onFrameRef = useRef(onFrame);
  const onHitRef = useRef(onHit);
  onFrameRef.current = onFrame;
  onHitRef.current = onHit;
  boxesRef.current = boxes;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setArmed(true);
      },
      { rootMargin: "220px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    onFrameRef.current(WATER_URLS[camera.offset % WATER_URLS.length]);
  }, [armed, camera.offset]);

  useEffect(() => {
    if (!armed) return;
    let timer = 0;
    let live = true;
    const loop = () => {
      setIndex((i) => {
        const next = (i + 1) % WATER_URLS.length;
        const url = WATER_URLS[next];
        onFrameRef.current(url);
        if (live) timer = window.setTimeout(loop, holdMs(url, reduced));
        return next;
      });
    };
    const first = WATER_URLS[camera.offset % WATER_URLS.length];
    timer = window.setTimeout(loop, camera.delay + holdMs(first, reduced));
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [armed, reduced, camera.delay, camera.offset]);

  const src = WATER_URLS[index];

  useEffect(() => {
    if (!armed) return;
    let timer = 0;
    let live = true;
    const scan = () => {
      if (!live) return;
      const img = imgRef.current;
      if (!img || !img.naturalWidth) return;
      const hits = detectWaste(img);
      const { boxes: next, spawned } = trackHits(boxesRef.current, hits, idRef.current);
      boxesRef.current = next;
      setBoxes(next);
      if (spawned.length) {
        setObjects((n) => n + spawned.length);
        const s = spawned[0];
        onHitRef.current({
          object: s.label,
          conf: `${s.conf.toFixed(1)}%`,
          frame: frameName(src),
        });
      }
    };
    const kick = () => {
      if (!live) return;
      scan();
      timer = window.setInterval(scan, reduced ? 900 : 360);
    };
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) kick();
    else img?.addEventListener("load", kick, { once: true });
    return () => {
      live = false;
      window.clearInterval(timer);
      img?.removeEventListener("load", kick);
    };
  }, [armed, src, reduced]);

  return (
    <article className="cctv-card">
      <header className="cctv-top">
        <span className="cctv-live">
          <span className="rec-dot" aria-hidden="true" />
          REC
        </span>
        <span className="cctv-id">{camera.id}</span>
        <time className="cctv-time" dateTime={now ? now.toISOString() : undefined}>
          {now ? istTime(now) : "--:--:--"}
        </time>
      </header>

      <div ref={stageRef} className="cctv-stage" aria-label={`${camera.id} live canal feed`}>
        {armed ? (
          <img
            ref={imgRef}
            className="cctv-frame"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            crossOrigin="anonymous"
            draggable={false}
            onError={() => setIndex((i) => (i + 1) % WATER_URLS.length)}
          />
        ) : null}
        <div className="cctv-tint" aria-hidden="true" />
        <div className="cctv-scan" aria-hidden="true" />
        <div className="cctv-sweep" aria-hidden="true" />
        <div className="cctv-hud" aria-hidden="true" />
        {boxes.map((box) => (
          <div
            key={box.id}
            className="yolo-box is-locked"
            style={{
              left: `${box.left}%`,
              top: `${box.top}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <span className="yolo-label">
              {box.label} {box.conf.toFixed(1)}%
            </span>
          </div>
        ))}
        <p className="cctv-place">{camera.location}</p>
      </div>

      <footer className="cctv-bottom">
        <span>Objects: {objects}</span>
        <span>YOLOv8 · {boxes.length} locked · {frameName(src)}</span>
      </footer>
    </article>
  );
}

export function DetectionFeed() {
  const headingId = useId();
  const [now, setNow] = useState<Date | null>(null);
  const [rows, setRows] = useState<LogRow[]>(INITIAL_LOG);
  const [reduced, setReduced] = useState(false);
  const frames = useRef<Record<string, string>>({});
  const logId = useRef(10);

  const pushHit = (camera: (typeof CAMERAS)[number], hit: { object: ObjectType; conf: string; frame: string }) => {
    frames.current[camera.id] = hit.frame;
    setRows((prev) =>
      [
        {
          key: ++logId.current,
          time: istTime(new Date()),
          camera: camera.id,
          object: hit.object,
          confidence: hit.conf,
          location: camera.location,
          frame: hit.frame,
        },
        ...prev,
      ].slice(0, 5),
    );
  };

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setNow(new Date());
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  return (
    <section className="feed reveal" aria-labelledby={headingId} id="ai-detection-feed">
      <div className="feed-inner">
        <header className="feed-head">
          <p className="feed-kicker">FloW-Img · ORCA-Uboat · Eluru & Krishna surface</p>
          <h2 id={headingId} className="feed-title">
            AI Detection Feed
          </h2>
          <p className="feed-sub">
            Bounding boxes lock onto bright floating waste on the water — sampled from each live
            frame, not random HUD.
          </p>
        </header>

        <div className="cctv-grid">
          {CAMERAS.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              now={now}
              reduced={reduced}
              onFrame={(url) => {
                frames.current[camera.id] = url;
              }}
              onHit={(hit) => pushHit(camera, hit)}
            />
          ))}
        </div>

        <article className="log-panel">
          <div className="log-head">
            <h3>Last 5 detections</h3>
            <p>Rolling log · IST · FloW water-surface frames and canal photography</p>
          </div>
          <div className="log-scroll">
            <table className="log-table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Camera</th>
                  <th scope="col">Object Type</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key} className={i === 0 ? "log-row-new" : undefined}>
                    <td className="num">{row.time}</td>
                    <td>{row.camera}</td>
                    <td>
                      {row.object}
                      <span className="log-frame"> · {row.frame}</span>
                    </td>
                    <td className="num log-conf">{row.confidence}</td>
                    <td>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
