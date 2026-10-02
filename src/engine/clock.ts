import { computeWindows, guessCoords, type Windows } from './sun';
import { cacheWindows } from './time';

let coords: [number, number] | null | undefined;
let cached: { key: string; w: Windows } | null = null;

export function getCoords(): [number, number] | null {
  if (coords === undefined) {
    try {
      coords = guessCoords(Intl.DateTimeFormat().resolvedOptions().timeZone, new Date().getTimezoneOffset());
    } catch {
      coords = null;
    }
  }
  return coords;
}

export function todaysWindows(now = new Date()): Windows {
  const key = now.toDateString();
  if (cached?.key !== key) {
    cached = { key, w: computeWindows(now, getCoords()) };
    cacheWindows(cached.w, now);
  }
  return cached.w;
}
