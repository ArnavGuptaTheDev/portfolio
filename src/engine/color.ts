export type RGB = [number, number, number];
export type Lab = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};

// OKLab (Björn Ottosson). Mixing here keeps hue and perceived lightness
// steady, so a navy→orange blend doesn't pass through muddy grey-brown.
export function rgbToLab(rgb: RGB): Lab {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function labToRgb([L, A, B]: Lab): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function mixLab(a: Lab, b: Lab, t: number): Lab {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((v) => toLinear(Math.min(255, Math.max(0, v))));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const minContrast = (fg: RGB, bgs: RGB[]) => Math.min(...bgs.map((b) => contrast(fg, b)));

/** Smallest binary-searched k in [0,1] for which `ok(k)` holds, assuming it's monotonic. */
function search(ok: (k: number) => boolean): number | null {
  if (!ok(1)) return null;
  if (ok(0)) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Moves a foreground colour's OKLab lightness toward black (dir -1) or white
 * (dir +1), keeping its hue, until it clears `target` against every
 * background. Returns null when even pure black/white can't get there.
 */
export function ensureContrast(fg: Lab, bgs: RGB[], target: number, dir: -1 | 1): Lab | null {
  const edge = dir < 0 ? 0 : 1;
  // Chroma fades as we approach black/white so the colour stays in gamut.
  const at = (k: number): Lab => {
    const c = 1 - k * 0.85;
    return [fg[0] + (edge - fg[0]) * k, fg[1] * c, fg[2] * c];
  };
  const k = search((k) => minContrast(labToRgb(at(k)), bgs) >= target);
  return k === null ? null : at(k);
}

/** Pushes a colour's lightness until its luminance is ≥ `minY` (light) or ≤ `maxY` (dark). */
export function clampLuminance(c: Lab, light: boolean, limit: number): Lab {
  const edge = light ? 1 : 0;
  const at = (k: number): Lab => [c[0] + (edge - c[0]) * k, c[1], c[2]];
  const y = (k: number) => luminance(labToRgb(at(k)));
  const k = search((k) => (light ? y(k) >= limit : y(k) <= limit));
  return k === null ? [edge, 0, 0] : at(k);
}

export function compositeRgb(under: RGB, over: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => under[i] + (over[i] - under[i]) * alpha) as RGB;
}
