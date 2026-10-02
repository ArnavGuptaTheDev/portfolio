/**
 * Walks the whole 24h blend in 5-minute steps under several sun schedules
 * and fails the build if any text pairing drops below WCAG AA (4.5:1).
 * Also reports how each raw keyframe fares before the runtime guard, which is
 * the number to tune palettes against.
 */
import { compositeRgb, contrast, hexToRgb, labToRgb, mixLab, rgbToHex, rgbToLab } from '../src/engine/color';
import { AA, computeState, heroSky, type SceneState } from '../src/engine/engine';
import { KEYFRAMES } from '../src/engine/phases';
import { fixedWindows, windowsFromSun, type Windows } from '../src/engine/sun';

const hm = (h: number, m = 0) => h * 60 + m;
const schedules: [string, Windows][] = [
  ['fixed', fixedWindows()],
  ['Lucknow, June', windowsFromSun(hm(5, 13), hm(18, 59), hm(12, 6), hm(0, 6))],
  ['Lucknow, December', windowsFromSun(hm(6, 53), hm(17, 15), hm(12, 4), hm(0, 4))],
  ['London, June', windowsFromSun(hm(4, 43), hm(21, 21), hm(13, 2), hm(1, 2))],
  ['London, December', windowsFromSun(hm(8, 3), hm(15, 53), hm(11, 58), hm(23, 58))],
  ['New York, March', windowsFromSun(hm(7, 1), hm(19, 10), hm(13, 5), hm(1, 5))],
];

type Pair = [string, string, (s: SceneState) => string[]];
// What the hero copy actually sits on: sky samples under the page-coloured scrim.
const heroBgs = (s: SceneState) =>
  heroSky(hexToRgb(s.colors.sky0), hexToRgb(s.colors.sky1)).map((sky) =>
    rgbToHex(compositeRgb(sky, hexToRgb(s.colors.bg), s.scrim)),
  );
const pairs: Pair[] = [
  ['text', 'bg/surface', (s) => [s.colors.bg, s.colors.surface]],
  ['muted', 'bg/surface', (s) => [s.colors.bg, s.colors.surface]],
  ['accent', 'bg/surface', (s) => [s.colors.bg, s.colors.surface]],
  ['accent2', 'bg/surface', (s) => [s.colors.bg, s.colors.surface]],
  ['onAccent', 'accent', (s) => [s.colors.accent]],
  ['hero', 'sky', heroBgs],
  ['heroMuted', 'sky', heroBgs],
];

const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
let failures = 0;
let worst = Infinity;
let maxScrim = 0;
let flips = 0;

for (const [name, w] of schedules) {
  for (let m = 0; m < 1440; m += 5) {
    const s = computeState(m, w);
    maxScrim = Math.max(maxScrim, s.scrim);
    if (s.light !== computeState(m - 5, w).light) flips++;
    for (const [fg, label, bgs] of pairs) {
      for (const bg of bgs(s)) {
        const c = contrast(hexToRgb(s.colors[fg as keyof SceneState['colors']]), hexToRgb(bg));
        worst = Math.min(worst, c);
        if (c < AA) {
          failures++;
          if (failures <= 20) console.error(`✗ ${name} ${fmt(m)} (${s.phase}) ${fg} on ${label} ${bg}: ${c.toFixed(2)}`);
        }
      }
    }
  }
}

console.log('\nRaw keyframes before the guard (min contrast):');
for (const k of KEYFRAMES) {
  const c = (a: string, b: string) => contrast(hexToRgb(a), hexToRgb(b));
  const mix = labToRgb(mixLab(rgbToLab(hexToRgb(k.c.sky0)), rgbToLab(hexToRgb(k.c.sky1)), 0.4));
  const row = {
    text: Math.min(c(k.c.text, k.c.bg), c(k.c.text, k.c.surface)),
    muted: Math.min(c(k.c.muted, k.c.bg), c(k.c.muted, k.c.surface)),
    accent: Math.min(c(k.c.accent, k.c.bg), c(k.c.accent, k.c.surface)),
    accent2: Math.min(c(k.c.accent2, k.c.bg), c(k.c.accent2, k.c.surface)),
    onAccent: c(k.c.onAccent, k.c.accent),
    hero: Math.min(contrast(hexToRgb(k.c.hero), mix), c(k.c.hero, k.c.sky1)),
  };
  const cells = Object.entries(row).map(([key, v]) => `${key} ${v.toFixed(1)}${v < AA ? '!' : ''}`);
  console.log(`  ${`${k.phase}@${k.at}`.padEnd(14)} ${cells.join('  ')}`);
}

console.log(`\nHero scrim peaks at ${maxScrim.toFixed(2)}; sections switch light/dark ${flips / schedules.length}× a day`);
console.log(`Worst blended contrast: ${worst.toFixed(2)}:1 across ${schedules.length} schedules × 288 steps`);
if (failures) {
  console.error(`Contrast check failed: ${failures} pairing(s) below ${AA}:1`);
  process.exit(1);
}
console.log('Contrast check passed.');
