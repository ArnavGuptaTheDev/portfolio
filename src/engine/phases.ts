export const PHASES = ['dawn', 'morning', 'day', 'dusk', 'night', 'midnight'] as const;
export type PhaseId = (typeof PHASES)[number];

export const PHASE_LABEL: Record<PhaseId, string> = {
  dawn: 'Dawn',
  morning: 'Morning',
  day: 'Daytime',
  dusk: 'Dusk',
  night: 'Night',
  midnight: 'Midnight',
};

/** Default windows as minutes after local midnight; each phase ends where the next begins. */
export const FIXED_STARTS: Record<PhaseId, number> = {
  dawn: 5 * 60,
  morning: 7 * 60,
  day: 11 * 60,
  dusk: 16 * 60,
  night: 19 * 60 + 30,
  midnight: 23 * 60 + 30,
};

/** Where inside a phase `?phase=` and the dial easter egg land: the most characteristic moment. */
export const PHASE_SHOWCASE: Record<PhaseId, number> = {
  dawn: 0.62,
  morning: 0.35,
  day: 0.45,
  dusk: 0.66,
  night: 0.4,
  midnight: 0.5,
};

export const COLOR_KEYS = [
  'bg', 'surface', 'text', 'muted', 'accent', 'accent2', 'glow', 'border', 'onAccent', 'hero',
  'sky0', 'sky1', 'sky2', 'sky3',
  'far', 'mid', 'city', 'near', 'fog', 'cloud', 'lit', 'sun',
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export const NUM_KEYS = [
  'stars', 'milky', 'aurora', 'mist', 'rays', 'clouds', 'shimmer', 'birds', 'fireflies',
  'dew', 'windows', 'shooting', 'speed', 'bloom', 'light', 'moon',
] as const;
export type NumKey = (typeof NUM_KEYS)[number];

export interface Keyframe {
  phase: PhaseId;
  /** Position inside the phase window, 0–1. */
  at: number;
  c: Record<ColorKey, string>;
  n: Partial<Record<NumKey, number>>;
}

/*
 * The palette timeline. Several keyframes can live inside one phase (dusk has
 * four: golden → orange → magenta → violet); the engine eases between whichever
 * two surround the current time, wrapping midnight back round to dawn.
 * `light` is the horizontal light direction: -1 from the left/east, +1 from the right/west.
 */
export const KEYFRAMES: Keyframe[] = [
  {
    phase: 'dawn', at: 0,
    c: {
      bg: '#121630', surface: '#1b2044', text: '#eceefa', muted: '#aeb3d3', accent: '#a9c0ff', accent2: '#f2b8a2',
      glow: '#8fa6ff', border: '#2f3663', onAccent: '#0f1330', hero: '#f1f2fb',
      sky0: '#0e1229', sky1: '#232c55', sky2: '#575c88', sky3: '#a7808c',
      far: '#2a2f55', mid: '#1d2142', city: '#151834', near: '#0c0e21', fog: '#6c7097', cloud: '#4b4f78',
      lit: '#ffd08a', sun: '#ffb27a',
    },
    n: { stars: 0.7, milky: 0.25, aurora: 0.05, mist: 0.6, clouds: 0.25, birds: 0.1, dew: 0.25, windows: 0.25, shooting: 0.2, speed: 0.55, bloom: 0.3, light: -1, moon: 0.7 },
  },
  {
    phase: 'dawn', at: 0.6,
    c: {
      bg: '#f7f1ec', surface: '#fffaf6', text: '#1f2238', muted: '#525771', accent: '#a8401f', accent2: '#4458a8',
      glow: '#ffb48a', border: '#e5d8ce', onAccent: '#ffffff', hero: '#1d2036',
      sky0: '#8ea2cc', sky1: '#c3cbe2', sky2: '#f6cfb2', sky3: '#ffb084',
      far: '#8c8eb2', mid: '#696a90', city: '#57577b', near: '#2f2d48', fog: '#f4ddd2', cloud: '#f8d3c3',
      lit: '#ffd59a', sun: '#ffa66b',
    },
    n: { stars: 0.08, mist: 0.85, rays: 0.3, clouds: 0.4, birds: 1, dew: 0.75, windows: 0.08, speed: 0.8, bloom: 0.65, light: -1, moon: 0.1 },
  },
  {
    phase: 'morning', at: 0.35,
    c: {
      bg: '#fbf8ef', surface: '#ffffff', text: '#1b2430', muted: '#4c5866', accent: '#8f5200', accent2: '#2a67a6',
      glow: '#ffd66b', border: '#e9e2cd', onAccent: '#ffffff', hero: '#17202b',
      sky0: '#5d9ad9', sky1: '#a9d0f1', sky2: '#f5e6bf', sky3: '#ffe39f',
      far: '#93abc9', mid: '#76a083', city: '#8394ab', near: '#3d6943', fog: '#f8f0db', cloud: '#ffffff',
      lit: '#fff1c4', sun: '#fff0b8',
    },
    n: { mist: 0.35, rays: 1, clouds: 0.75, birds: 0.5, dew: 1, speed: 1, bloom: 0.6, light: -0.6 },
  },
  {
    phase: 'day', at: 0.45,
    c: {
      bg: '#f4f7fb', surface: '#ffffff', text: '#0f1b2a', muted: '#435268', accent: '#1557bd', accent2: '#0b7466',
      glow: '#7cc4ff', border: '#d9e3ee', onAccent: '#ffffff', hero: '#0c1726',
      sky0: '#2f7ad6', sky1: '#7fb8ee', sky2: '#d3e9f8', sky3: '#f4f9ff',
      far: '#8aa6c8', mid: '#5f9270', city: '#71849a', near: '#2d5c38', fog: '#eaf3fb', cloud: '#ffffff',
      lit: '#fff6d8', sun: '#fffbe8',
    },
    n: { mist: 0.12, rays: 0.2, clouds: 0.6, shimmer: 1, birds: 0.4, speed: 1, bloom: 1, light: 0 },
  },
  {
    phase: 'dusk', at: 0,
    c: {
      bg: '#fbf3e4', surface: '#fffaf0', text: '#22190f', muted: '#584a3a', accent: '#9a4510', accent2: '#723b88',
      glow: '#ffbe5c', border: '#eadbc0', onAccent: '#ffffff', hero: '#1f160c',
      sky0: '#5a85c4', sky1: '#b4c8dc', sky2: '#f7dba4', sky3: '#ffc56b',
      far: '#8e90a6', mid: '#6d7a5c', city: '#5e6170', near: '#36472a', fog: '#f5dcb0', cloud: '#ffe6b8',
      lit: '#ffd88f', sun: '#ffd47a',
    },
    n: { mist: 0.3, rays: 0.5, clouds: 0.5, shimmer: 0.4, birds: 0.5, windows: 0.04, speed: 0.9, bloom: 0.9, light: 0.8 },
  },
  {
    phase: 'dusk', at: 0.6,
    c: {
      bg: '#2a1a2e', surface: '#362238', text: '#fbefe6', muted: '#d8c2ba', accent: '#ffb06b', accent2: '#f58fb5',
      glow: '#ff8a3d', border: '#4d3148', onAccent: '#2a1408', hero: '#fff6ef',
      sky0: '#2b3a74', sky1: '#7d4a7c', sky2: '#f0934f', sky3: '#ffb347',
      far: '#5b3f63', mid: '#3f2b48', city: '#2b1f36', near: '#1a1222', fog: '#e48a66', cloud: '#ff9f6b',
      lit: '#ffc070', sun: '#ff9a3c',
    },
    n: { stars: 0.04, mist: 0.35, rays: 0.25, clouds: 0.45, shimmer: 0.1, birds: 0.6, windows: 0.35, speed: 0.8, bloom: 1, light: 1 },
  },
  {
    phase: 'dusk', at: 0.82,
    c: {
      bg: '#1d1430', surface: '#281c40', text: '#f6eefb', muted: '#c9b9d9', accent: '#ff9ec3', accent2: '#ffb36b',
      glow: '#e2558f', border: '#3d2c58', onAccent: '#2a0c1c', hero: '#fbf5ff',
      sky0: '#211c50', sky1: '#5a2f72', sky2: '#d0577a', sky3: '#ff7a59',
      far: '#3a2550', mid: '#281a3c', city: '#1b1230', near: '#100a1c', fog: '#9b4f80', cloud: '#c45a86',
      lit: '#ffc77a', sun: '#ff6a4a',
    },
    n: { stars: 0.3, mist: 0.3, clouds: 0.35, birds: 0.2, windows: 0.62, speed: 0.7, bloom: 0.6, light: 1, moon: 0.4 },
  },
  {
    phase: 'dusk', at: 0.97,
    c: {
      bg: '#14122e', surface: '#1e1a40', text: '#efeafc', muted: '#b9b1d6', accent: '#b9a3ff', accent2: '#ff9fc0',
      glow: '#8a6bff', border: '#332c5e', onAccent: '#140f30', hero: '#f5f1ff',
      sky0: '#13133a', sky1: '#2f2764', sky2: '#644889', sky3: '#9a5a8e',
      far: '#241c45', mid: '#19143a', city: '#120e2c', near: '#0a0819', fog: '#4a3a7a', cloud: '#4a3a72',
      lit: '#ffc77a', sun: '#ff6a4a',
    },
    n: { stars: 0.6, milky: 0.1, mist: 0.25, clouds: 0.3, windows: 0.75, fireflies: 0.35, speed: 0.6, bloom: 0.4, light: 0.6, moon: 0.8 },
  },
  {
    phase: 'night', at: 0.4,
    c: {
      bg: '#0a0f24', surface: '#121a38', text: '#e8eefb', muted: '#a6b1cf', accent: '#8fc1ff', accent2: '#ffd27a',
      glow: '#5a8cff', border: '#233057', onAccent: '#071026', hero: '#f0f4fd',
      sky0: '#060a20', sky1: '#0e183b', sky2: '#1d2c58', sky3: '#2b3d6c',
      far: '#141d3e', mid: '#0d1430', city: '#0a0f26', near: '#050816', fog: '#24345e', cloud: '#26355e',
      lit: '#ffcf87', sun: '#ff6a4a',
    },
    n: { stars: 0.9, milky: 0.35, aurora: 0.1, mist: 0.15, clouds: 0.15, windows: 0.55, fireflies: 1, shooting: 0.3, speed: 0.6, bloom: 0.5, light: 0.3, moon: 1 },
  },
  {
    phase: 'midnight', at: 0.5,
    c: {
      bg: '#07081a', surface: '#0e1130', text: '#e7e9f7', muted: '#a3a8c9', accent: '#9fb3ff', accent2: '#c9a7ff',
      glow: '#6b7cff', border: '#262b55', onAccent: '#0a0c22', hero: '#eef0fa',
      sky0: '#04050e', sky1: '#090c20', sky2: '#131938', sky3: '#1c224e',
      far: '#0d1028', mid: '#090b1d', city: '#06071a', near: '#030410', fog: '#1a2048', cloud: '#1a1f3c',
      lit: '#ffcf87', sun: '#ff6a4a',
    },
    n: { stars: 1, milky: 0.9, aurora: 0.55, mist: 0.15, clouds: 0.08, windows: 0.06, fireflies: 0.15, shooting: 1, speed: 0.4, bloom: 0.25, light: 0, moon: 1 },
  },
];
