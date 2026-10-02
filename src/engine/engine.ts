import { clampLuminance, compositeRgb, ensureContrast, hexToRgb, labToRgb, luminance, mixLab, rgbToHex, rgbToLab, type Lab, type RGB } from './color';
import { COLOR_KEYS, KEYFRAMES, NUM_KEYS, PHASES, type ColorKey, type NumKey, type PhaseId } from './phases';
import { fixedWindows, type Windows } from './sun';

export interface SceneState {
  minutes: number;
  phase: PhaseId;
  /** 0–1 through the current phase window. */
  progress: number;
  colors: Record<ColorKey | 'heroMuted', string>;
  num: Record<NumKey, number>;
  /** Sun and moon along their arcs: x 0–1 left→right, alt -1–1 (below 0 is under the horizon). */
  sun: { x: number; alt: number };
  moon: { x: number; alt: number };
  windows: Windows;
  /** Opacity of the page-coloured veil behind the hero copy. */
  scrim: number;
  /** Sections are in light mode (dark text). */
  light: boolean;
}

export const AA = 4.5;
// Guard to a hair above AA so rounding to hex can never land us under it.
const GUARD = 4.6;
const LIGHT_MIN_Y = 0.26;
const DARK_MAX_Y = 0.12;

/** The two sky samples behind the hero copy, which sits ~25–60% down the sky. */
export function heroSky(sky0: RGB, sky1: RGB): RGB[] {
  return [labToRgb(mixLab(rgbToLab(sky0), rgbToLab(sky1), 0.4)), sky1];
}

const wrap = (m: number) => ((m % 1440) + 1440) % 1440;
const smooth = (t: number) => t * t * (3 - 2 * t);

const LABS = KEYFRAMES.map((k) => {
  const out = {} as Record<ColorKey, Lab>;
  for (const key of COLOR_KEYS) out[key] = rgbToLab(hexToRgb(k.c[key]));
  return out;
});

export function phaseAt(minutes: number, w: Windows): { phase: PhaseId; progress: number } {
  for (let i = 0; i < PHASES.length; i++) {
    const start = w.starts[PHASES[i]];
    const len = wrap(w.starts[PHASES[(i + 1) % PHASES.length]] - start);
    const into = wrap(minutes - start);
    if (into < len) return { phase: PHASES[i], progress: into / len };
  }
  return { phase: 'day', progress: 0.5 };
}

export function minutesFor(phase: PhaseId, progress: number, w: Windows): number {
  const i = PHASES.indexOf(phase);
  const len = wrap(w.starts[PHASES[(i + 1) % PHASES.length]] - w.starts[phase]);
  return wrap(w.starts[phase] + len * progress);
}

/*
 * Blend math. Every keyframe is pinned to a clock time (its phase start plus
 * `at` × the phase length), so when the windows stretch with the seasons the
 * keyframes stretch with them. We find the pair surrounding `minutes` on the
 * 24h circle and mix with smoothstep, which has zero slope at both ends: the
 * palette eases out of one keyframe and into the next with no visible kink,
 * and two blends meeting at a keyframe join seamlessly.
 */
function surrounding(minutes: number, w: Windows): { a: number; b: number; t: number } {
  const times = KEYFRAMES.map((k) => minutesFor(k.phase, k.at, w));
  let a = 0;
  let best = Infinity;
  for (let i = 0; i < times.length; i++) {
    const since = wrap(minutes - times[i]);
    if (since < best) {
      best = since;
      a = i;
    }
  }
  const b = (a + 1) % times.length;
  const span = wrap(times[b] - times[a]) || 1440;
  return { a, b, t: smooth(Math.min(1, best / span)) };
}

/** One blended colour, without the contrast pass. Cheap enough to sample the whole day. */
export function colorAt(key: ColorKey, minutes: number, w: Windows): string {
  const { a, b, t } = surrounding(wrap(minutes), w);
  return rgbToHex(labToRgb(mixLab(LABS[a][key], LABS[b][key], t)));
}

function arc(minutes: number, rise: number, set: number) {
  const span = wrap(set - rise) || 1;
  const s = wrap(minutes - rise) / span;
  // Past the set point the body is below the horizon; map that stretch to a dip.
  if (s > 1) {
    const under = (wrap(minutes - set) / (1440 - span)) * Math.PI;
    return { x: 1.1, alt: -Math.sin(under) };
  }
  return { x: s, alt: Math.sin(s * Math.PI) };
}

export function computeState(minutes: number, w: Windows = fixedWindows()): SceneState {
  minutes = wrap(minutes);
  const { phase, progress } = phaseAt(minutes, w);
  const { a, b, t } = surrounding(minutes, w);

  const lab = {} as Record<ColorKey, Lab>;
  for (const key of COLOR_KEYS) lab[key] = mixLab(LABS[a][key], LABS[b][key], t);

  const num = {} as Record<NumKey, number>;
  for (const key of NUM_KEYS) {
    const va = KEYFRAMES[a].n[key] ?? 0;
    const vb = KEYFRAMES[b].n[key] ?? 0;
    num[key] = va + (vb - va) * t;
  }

  const rgb = (k: ColorKey): RGB => labToRgb(lab[k]);

  /*
   * Contrast. A background near mid-luminance (~0.18) can't carry AA text in
   * either polarity once bg and surface differ slightly, and any continuous
   * light→dark blend has to cross it. So sections are always either light or
   * dark: the blended bg/surface are pushed out of the band, which turns the
   * crossing into one small step (softened by a CSS transition). Text tokens
   * then move toward black or white only as far as AA needs.
   */
  const light = luminance(rgb('bg')) > 0.18;
  const dir = light ? -1 : 1;
  const extreme: Lab = light ? [0, 0, 0] : [1, 0, 0];
  lab.bg = clampLuminance(lab.bg, light, light ? LIGHT_MIN_Y : DARK_MAX_Y);
  lab.surface = clampLuminance(lab.surface, light, light ? LIGHT_MIN_Y : DARK_MAX_Y);
  const bg = rgb('bg');
  const page = [bg, rgb('surface')];
  for (const k of ['text', 'muted', 'accent', 'accent2'] as const) {
    lab[k] = ensureContrast(lab[k], page, GUARD, dir) ?? extreme;
  }
  lab.onAccent = ensureContrast(lab.onAccent, [rgb('accent')], GUARD, light ? 1 : -1) ?? [light ? 1 : 0, 0, 0];

  // Hero copy sits on the sky, which keeps blending continuously. A soft
  // scrim in the page colour sits behind it; use the lightest one that works.
  const sky = heroSky(rgb('sky0'), rgb('sky1'));
  let scrim = 0;
  let hero: Lab | null = null;
  let heroMuted: Lab | null = null;
  for (let i = 0; i <= 18; i++) {
    scrim = i * 0.05;
    const backs = sky.map((s) => compositeRgb(s, bg, scrim));
    hero = ensureContrast(lab.hero, backs, GUARD, dir);
    heroMuted = ensureContrast(mixLab(lab.hero, lab.sky1, 0.22), backs, GUARD, dir);
    if (hero && heroMuted) break;
  }
  lab.hero = hero ?? extreme;

  const colors = {} as SceneState['colors'];
  for (const key of COLOR_KEYS) colors[key] = rgbToHex(labToRgb(lab[key]));
  colors.heroMuted = rgbToHex(labToRgb(heroMuted ?? extreme));

  return {
    minutes,
    phase,
    progress,
    colors,
    num,
    scrim,
    light,
    sun: arc(minutes, w.sunrise, w.sunset),
    moon: arc(minutes, w.sunset + 20, w.sunrise - 20),
    windows: w,
  };
}

export const CSS_VARS: (ColorKey | 'heroMuted')[] = [...COLOR_KEYS, 'heroMuted'];

