import { gsap } from 'gsap';
import { todaysWindows } from '../engine/clock';
import { computeState, minutesFor, type SceneState } from '../engine/engine';
import { PHASES, PHASE_SHOWCASE } from '../engine/phases';
import type { Windows } from '../engine/sun';
import { realMinutes, urlMinutes } from '../engine/time';
import { rootStyle, type Rect } from '../engine/vars';

type Listener = (s: SceneState) => void;

const root = document.documentElement;
const listeners = new Set<Listener>();
const wrap = (m: number) => ((m % 1440) + 1440) % 1440;
/** Signed shortest distance around the 24h circle. */
const shortest = (from: number, to: number) => ((to - from + 2160) % 1440) - 720;

let windows: Windows = todaysWindows();
let shown = 0;
let live = true;
let state: SceneState;
let size: { w: number; h: number; avoid?: Rect } = { w: innerWidth, h: innerHeight };
let tween: gsap.core.Tween | null = null;
let uiEaseTimer = 0;

function apply() {
  const prev = state;
  state = computeState(shown, windows);
  if (prev && prev.light !== state.light) {
    root.classList.add('theme-ease-ui');
    clearTimeout(uiEaseTimer);
    uiEaseTimer = window.setTimeout(() => root.classList.remove('theme-ease-ui'), 1000);
  }
  root.style.cssText = rootStyle(state, size.w, size.h, size.avoid);
  root.dataset.phase = state.phase;
  for (const l of listeners) l(state);
}

function tweenTo(target: number, duration: number) {
  tween?.kill();
  const from = { m: shown };
  tween = gsap.to(from, {
    m: target,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      shown = wrap(from.m);
      apply();
    },
    onComplete: () => {
      tween = null;
    },
  });
}

export const theme = {
  get state() {
    return state;
  },
  get windows() {
    return windows;
  },
  get live() {
    return live;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    if (state) l(state);
    return () => listeners.delete(l);
  },
  setViewport(w: number, h: number, avoid?: Rect) {
    size = { w, h, avoid };
    if (state) apply();
  },
  /** Follow the pointer exactly (dial drag, debug slider). */
  scrub(minutes: number) {
    tween?.kill();
    live = false;
    shown = wrap(minutes);
    apply();
  },
  /** Ease to a time, the short way round. */
  goTo(minutes: number, duration = 0.6) {
    live = false;
    tweenTo(shown + shortest(shown, wrap(minutes)), duration);
  },
  /** Easter egg: roll forward through the sky to the next phase's showcase moment. */
  nextPhase() {
    const i = PHASES.indexOf(state.phase);
    const next = PHASES[(i + 1) % PHASES.length];
    const target = minutesFor(next, PHASE_SHOWCASE[next], windows);
    live = false;
    tweenTo(shown + wrap(target - shown), 2.4);
  },
  backToNow() {
    live = true;
    windows = todaysWindows();
    tweenTo(shown + shortest(shown, realMinutes()), 1.4);
  },
};

function refresh() {
  windows = todaysWindows();
  if (live && !tween) {
    shown = realMinutes();
    apply();
  }
}

export function startTheme() {
  const pinned = urlMinutes(location.search, windows);
  live = pinned === null;
  shown = pinned ?? realMinutes();
  // The head script used fixed (or cached) windows; ease into the SunCalc-refined state.
  root.classList.add('theme-ease');
  apply();
  setTimeout(() => root.classList.remove('theme-ease'), 1200);
  setInterval(refresh, 60_000);
  document.addEventListener('visibilitychange', () => !document.hidden && refresh());
}
