export type WasteLabel = "Plastic Waste" | "Debris" | "Garbage Bag";

export type WasteHit = {
  left: number;
  top: number;
  width: number;
  height: number;
  label: WasteLabel;
  conf: number;
  area: number;
};

const DW = 160;
const DH = 90;

let canvas: HTMLCanvasElement | null = null;

function getCanvas() {
  if (typeof document === "undefined") return null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = DW;
    canvas.height = DH;
  }
  return canvas;
}

function clamp(n: number, a: number, b: number) {
  return n < a ? a : n > b ? b : n;
}

function blurSep(src: Float32Array, w: number, h: number, k: number) {
  const r = (k - 1) >> 1;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const div = k;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    const row = y * w;
    for (let x = -r; x <= r; x++) sum += src[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / div;
      sum += src[row + clamp(x + r + 1, 0, w - 1)] - src[row + clamp(x - r, 0, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / div;
      sum += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
    }
  }
  return out;
}

function labelFor(areaPct: number): WasteLabel {
  if (areaPct < 1.8) return "Plastic Waste";
  if (areaPct < 4.5) return "Debris";
  return "Garbage Bag";
}

export function detectWaste(img: HTMLImageElement): WasteHit[] {
  const canvas = getCanvas();
  if (!canvas || !img.naturalWidth) return [];
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  try {
    ctx.drawImage(img, 0, 0, DW, DH);
    const { data } = ctx.getImageData(0, 0, DW, DH);
    const L = new Float32Array(DW * DH);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      L[p] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    const bg = blurSep(L, DW, DH, 15);
    const sorted = Array.from(L).sort((a, b) => a - b);
    const p62 = sorted[Math.floor(sorted.length * 0.62)] ?? 140;
    const mask = new Uint8Array(DW * DH);
    for (let i = 0; i < L.length; i++) {
      const y = (i / DW) | 0;
      if (y < DH * 0.16) continue;
      if (L[i] - bg[i] > 10 && L[i] > p62) mask[i] = 1;
    }
    const seen = new Uint8Array(DW * DH);
    const hits: WasteHit[] = [];
    const dirs = [1, -1, DW, -DW, DW + 1, DW - 1, -DW + 1, -DW - 1];
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i] || seen[i]) continue;
      const stack = [i];
      seen[i] = 1;
      let minX = i % DW;
      let maxX = minX;
      let minY = (i / DW) | 0;
      let maxY = minY;
      let area = 0;
      let sumL = 0;
      while (stack.length) {
        const cur = stack.pop()!;
        const x = cur % DW;
        const y = (cur / DW) | 0;
        area++;
        sumL += L[cur];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        for (const d of dirs) {
          const n = cur + d;
          if (n < 0 || n >= mask.length || seen[n] || !mask[n]) continue;
          const nx = n % DW;
          if (Math.abs(nx - x) > 1) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
      if (area < 7) continue;
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const topPct = (minY / DH) * 100;
      if (bw > DW * 0.34 && topPct < 42) continue;
      if (bh > DH * 0.38) continue;
      if (bw < 4 || bh < 3) continue;
      if (area / (bw * bh) < 0.22) continue;
      if (topPct < 28 && bw > DW * 0.16 && bh > DH * 0.14) continue;
      const pad = 3;
      const x0 = Math.max(0, minX - pad);
      const y0 = Math.max(0, minY - pad);
      const x1 = Math.min(DW - 1, maxX + pad);
      const y1 = Math.min(DH - 1, maxY + pad);
      const width = ((x1 - x0 + 1) / DW) * 100;
      const height = ((y1 - y0 + 1) / DH) * 100;
      const left = (x0 / DW) * 100;
      const top = (y0 / DH) * 100;
      const meanL = sumL / area;
      const fill = area / (bw * bh);
      const conf = Math.min(97.8, 84 + (meanL - 150) * 0.06 + fill * 8);
      const areaPct = (width * height) / 100;
      hits.push({
        left,
        top,
        width,
        height,
        label: labelFor(areaPct),
        conf: Math.round(conf * 10) / 10,
        area,
      });
    }
    hits.sort((a, b) => b.area - a.area);
    return hits.slice(0, 4);
  } catch {
    return [];
  }
}

export function trackHits(
  prev: Array<WasteHit & { id: number; misses: number }>,
  hits: WasteHit[],
  nextId: { n: number },
) {
  const used = new Set<number>();
  const next: Array<WasteHit & { id: number; misses: number }> = [];
  for (const p of prev) {
    let best = -1;
    let bestD = 420;
    hits.forEach((h, i) => {
      if (used.has(i)) return;
      const dx = p.left + p.width / 2 - (h.left + h.width / 2);
      const dy = p.top + p.height / 2 - (h.top + h.height / 2);
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0 && bestD < 22 * 22) {
      used.add(best);
      const h = hits[best];
      next.push({
        id: p.id,
        left: p.left * 0.4 + h.left * 0.6,
        top: p.top * 0.4 + h.top * 0.6,
        width: p.width * 0.4 + h.width * 0.6,
        height: p.height * 0.4 + h.height * 0.6,
        label: h.label,
        conf: h.conf,
        area: h.area,
        misses: 0,
      });
    } else if (p.misses < 5) {
      next.push({ ...p, misses: p.misses + 1 });
    }
  }
  const fresh: typeof next = [];
  hits.forEach((h, i) => {
    if (used.has(i)) return;
    fresh.push({ ...h, id: ++nextId.n, misses: 0 });
  });
  return { boxes: [...next, ...fresh].slice(0, 5), spawned: fresh };
}
