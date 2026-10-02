// Build-time scene geometry. Seeded so every build draws the same landscape.

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const X0 = -160;
const X1 = 1760;
const BOTTOM = 900;

/** A closed ridge silhouette: sharp peaks (`jag` high) or rolling hills (`jag` low). */
export function ridge(seed: number, base: number, amp: number, step: number, jag: number, peaks: [number, number, number][] = []) {
  const rand = rng(seed);
  const pts: [number, number][] = [];
  for (let x = X0; x <= X1 + step; x += step * (0.7 + rand() * 0.6)) {
    let y = base + Math.sin(x / 260 + seed) * amp * 0.35 + Math.sin(x / 97 + seed * 2) * amp * 0.12;
    for (const [px, h, wdt] of peaks) y -= h * Math.exp(-(((x - px) / wdt) ** 2));
    y += (rand() - 0.5) * amp * jag;
    pts.push([x, y]);
  }
  let d = `M${X0},${BOTTOM}L${r1(pts[0][0])},${r1(pts[0][1])}`;
  if (jag > 0.4) {
    for (const [x, y] of pts.slice(1)) d += `L${r1(x)},${r1(y)}`;
  } else {
    // Smooth hills: quadratic curves through midpoints.
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += `Q${r1(pts[i][0])},${r1(pts[i][1])} ${r1(mx)},${r1(my)}`;
    }
  }
  return `${d}L${X1},${BOTTOM}Z`;
}

export interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  antenna?: number;
}
export interface Win {
  x: number;
  y: number;
  /** Order in which windows light up at dusk (0 first). */
  rank: number;
}

export function skyline(seed: number, from: number, to: number, ground: number) {
  const rand = rng(seed);
  const buildings: Building[] = [];
  const windows: Win[] = [];
  let x = from;
  while (x < to) {
    const w = 18 + Math.round(rand() * 30);
    const centre = 1 - Math.abs((x - (from + to) / 2) / ((to - from) / 2));
    const tall = rand() < 0.18;
    const h = Math.round(40 + centre * 70 + rand() * 50 + (tall ? 60 + rand() * 50 : 0));
    const b: Building = { x, y: ground - h, w, h };
    if (tall && rand() < 0.6) b.antenna = 12 + Math.round(rand() * 18);
    buildings.push(b);
    for (let wy = b.y + 8; wy < ground - 14; wy += 11) {
      for (let wx = x + 5; wx < x + w - 6; wx += 8) {
        if (rand() < 0.3) windows.push({ x: wx, y: wy, rank: rand() });
      }
    }
    x += w + (rand() < 0.3 ? 2 + Math.round(rand() * 6) : 0);
  }
  return { buildings, windows };
}

export function grass(seed: number, base: number) {
  const rand = rng(seed);
  let d = '';
  for (let x = X0; x < X1; x += 5 + rand() * 6) {
    const y = base + Math.sin(x / 180) * 10 + Math.sin(x / 61) * 4;
    const h = 8 + rand() * 18;
    const lean = (rand() - 0.5) * 8;
    d += `M${r1(x)},${r1(y + 2)}L${r1(x + 1.6 + lean)},${r1(y - h)}L${r1(x + 3.2)},${r1(y + 2)}Z`;
  }
  return d;
}

export function ground(base: number) {
  let d = `M${X0},${BOTTOM}`;
  for (let x = X0; x <= X1; x += 40) d += `L${x},${r1(base + Math.sin(x / 180) * 10 + Math.sin(x / 61) * 4)}`;
  return `${d}L${X1},${BOTTOM}Z`;
}

export function pine(x: number, baseY: number, h: number) {
  const w = h * 0.36;
  let d = `M${r1(x - 2)},${baseY}h4v${r1(-h * 0.18)}h-4Z`;
  for (let i = 0; i < 4; i++) {
    const top = baseY - h + i * h * 0.17;
    const bottom = top + h * 0.38;
    const tw = w * (0.45 + i * 0.2);
    d += `M${r1(x)},${r1(top)}L${r1(x + tw)},${r1(bottom)}L${r1(x - tw)},${r1(bottom)}Z`;
  }
  return d;
}

export function roundTree(x: number, baseY: number, h: number) {
  const r = h * 0.3;
  const cy = baseY - h + r;
  const c = (cx: number, cy2: number, rr: number) =>
    `M${r1(cx - rr)},${r1(cy2)}a${r1(rr)},${r1(rr)} 0 1,0 ${r1(rr * 2)},0a${r1(rr)},${r1(rr)} 0 1,0 ${r1(-rr * 2)},0Z`;
  return (
    `M${r1(x - 3)},${baseY}h6v${r1(-h * 0.45)}h-6Z` +
    c(x, cy, r) +
    c(x - r * 0.65, cy + r * 0.35, r * 0.7) +
    c(x + r * 0.7, cy + r * 0.3, r * 0.72)
  );
}

/** Soft cloud puffs as circles [cx, cy, r]; filled with a radial gradient so edges stay feathered. */
export function cloudPuffs(seed: number, w: number): [number, number, number][] {
  const rand = rng(seed);
  const h = w * 0.3;
  const puffs: [number, number, number][] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Taller in the middle, flatter at the ends.
    const lift = Math.sin(t * Math.PI);
    const r = w * (0.1 + lift * 0.11 + rand() * 0.04);
    puffs.push([r1(w * (0.12 + t * 0.76)), r1(h * (0.75 - lift * 0.38) + rand() * 6), r1(r)]);
  }
  for (let i = 0; i < 3; i++) puffs.push([r1(w * (0.25 + i * 0.25)), r1(h * 0.82), r1(w * 0.16)]);
  return puffs;
}

/** A soft aurora curtain: wavy top and bottom edges. */
export function curtain(seed: number, x0: number, x1: number, top: number, bottom: number) {
  const rand = rng(seed);
  const n = 8;
  const step = (x1 - x0) / n;
  const topPts = Array.from({ length: n + 1 }, (_, i) => [x0 + i * step, top + (rand() - 0.5) * 70] as const);
  const botPts = Array.from({ length: n + 1 }, (_, i) => [x0 + i * step, bottom + (rand() - 0.5) * 40] as const);
  let d = `M${r1(topPts[0][0])},${r1(topPts[0][1])}`;
  for (let i = 1; i <= n; i++) {
    const [px, py] = topPts[i - 1];
    const [x, y] = topPts[i];
    d += `C${r1(px + step / 2)},${r1(py)} ${r1(x - step / 2)},${r1(y)} ${r1(x)},${r1(y)}`;
  }
  d += `L${r1(botPts[n][0])},${r1(botPts[n][1])}`;
  for (let i = n - 1; i >= 0; i--) {
    const [px, py] = botPts[i + 1];
    const [x, y] = botPts[i];
    d += `C${r1(px - step / 2)},${r1(py)} ${r1(x + step / 2)},${r1(y)} ${r1(x)},${r1(y)}`;
  }
  return `${d}Z`;
}
