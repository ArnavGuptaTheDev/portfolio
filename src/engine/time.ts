import { minutesFor } from './engine';
import { PHASES, PHASE_SHOWCASE, type PhaseId } from './phases';
import type { Windows } from './sun';

export function realMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

/** `?t=18:45` or `?phase=dusk`; null when neither is present or valid. */
export function urlMinutes(search: string, w: Windows): number | null {
  const params = new URLSearchParams(search);
  const t = params.get('t')?.match(/^(\d{1,2}):?(\d{2})$/);
  if (t) {
    const h = Number(t[1]);
    const m = Number(t[2]);
    if (h < 24 && m < 60) return h * 60 + m;
  }
  const phase = params.get('phase')?.toLowerCase();
  if (phase && (PHASES as readonly string[]).includes(phase)) {
    const id = phase as PhaseId;
    return minutesFor(id, PHASE_SHOWCASE[id], w);
  }
  return null;
}

const CACHE_KEY = 'sky-windows';

/** Today's sun-shifted windows from an earlier visit, so the boot script can skip SunCalc. */
export function cachedWindows(now = new Date()): Windows | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return raw?.day === now.toDateString() ? raw.w : null;
  } catch {
    return null;
  }
}

export function cacheWindows(w: Windows, now = new Date()): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ day: now.toDateString(), w }));
  } catch {
    // Private mode or storage blocked: the boot script just uses fixed windows.
  }
}
