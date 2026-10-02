import { CSS_VARS, type SceneState } from './engine';
import { NUM_KEYS } from './phases';

export const VIEW_W = 1600;
export const VIEW_H = 900;
/** Where the sun and moon cross the horizon (hidden behind the far ridge). */
export const HORIZON_Y = 615;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The slice of the 1600×900 viewBox actually on screen. The scene uses
 * `xMidYMax slice`, so tall/narrow screens crop the sides and very wide ones
 * crop the top of the sky.
 */
export function visibleBox(w: number, h: number) {
  const scale = Math.max(w / VIEW_W, h / VIEW_H);
  const vw = w / scale;
  const vh = h / scale;
  return { x0: (VIEW_W - vw) / 2, x1: (VIEW_W + vw) / 2, y0: VIEW_H - vh, scale };
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Sun and moon positions in viewBox units, kept inside whatever slice is
 * visible. `avoid` is the hero copy in CSS px: when the copy is light (dark
 * mode) a bright disc behind it would wash it out, so the disc fades as it
 * passes behind the text, as if going behind a pane.
 */
export function celestial(s: SceneState, w: number, h: number, avoid?: Rect) {
  const box = visibleBox(w, h);
  const margin = Math.min(110, (box.x1 - box.x0) * 0.14);
  const left = box.x0 + margin;
  const right = box.x1 - margin;
  const peak = box.y0 + Math.min(150, (HORIZON_Y - box.y0) * 0.28);
  const place = (b: { x: number; alt: number }) => ({
    x: left + (right - left) * Math.min(1.08, b.x),
    y: HORIZON_Y - Math.max(-0.2, b.alt) * (HORIZON_Y - peak),
  });
  const sun = place(s.sun);
  const moon = place(s.moon);
  const clear = (p: { x: number; y: number }, r: number) => {
    if (!avoid || s.light) return 1;
    const px = (p.x - box.x0) * box.scale;
    const py = (p.y - box.y0) * box.scale;
    const dx = Math.max(avoid.left - px, 0, px - avoid.right);
    const dy = Math.max(avoid.top - py, 0, py - avoid.bottom);
    return smoothstep(r * box.scale, r * box.scale + 70, Math.hypot(dx, dy));
  };
  return {
    sunX: sun.x,
    sunY: sun.y,
    sunO: clamp01((s.sun.alt + 0.06) / 0.12) * clear(sun, 46),
    // The sun swells a little as it nears the horizon.
    sunS: 1 + 0.35 * clamp01(1 - s.sun.alt * 3),
    moonX: moon.x,
    moonY: moon.y,
    moonO: s.num.moon * clamp01((s.moon.alt + 0.04) / 0.14) * clear(moon, 40),
  };
}

/** Everything the page reads from the engine, as one inline-style string. */
export function rootStyle(s: SceneState, w: number, h: number, avoid?: Rect): string {
  const c = celestial(s, w, h, avoid);
  const parts = CSS_VARS.map((k) => `--${k}:${s.colors[k]}`);
  for (const k of NUM_KEYS) parts.push(`--n-${k}:${s.num[k].toFixed(3)}`);
  parts.push(
    `--scrim:${s.scrim.toFixed(2)}`,
    `--sun-x:${c.sunX.toFixed(1)}px`, `--sun-y:${c.sunY.toFixed(1)}px`, `--sun-o:${c.sunO.toFixed(3)}`, `--sun-s:${c.sunS.toFixed(3)}`,
    `--moon-x:${c.moonX.toFixed(1)}px`, `--moon-y:${c.moonY.toFixed(1)}px`, `--moon-o:${c.moonO.toFixed(3)}`,
    `color-scheme:${s.light ? 'light' : 'dark'}`,
  );
  return parts.join(';');
}
