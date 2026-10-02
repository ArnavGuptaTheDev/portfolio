import { startDeviceTilt } from './interactions/device-tilt';
import { startCursor } from './interactions/cursor';
import { startDial } from './interactions/dial';
import { startFooter } from './interactions/footer';
import { startMagnetic } from './interactions/magnetic';
import { startPipeline } from './interactions/pipeline';
import { startReveal } from './interactions/reveal';
import { startScramble } from './interactions/scramble';
import { startTilt } from './interactions/tilt';
import { finePointer, reducedMotion } from './runtime/device';
import { startTheme, theme } from './runtime/theme';
import { startScene } from './scene/runtime';

const hero = document.querySelector<HTMLElement>('.hero')!;
const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300);

startTheme();
startDial();
startFooter();

// The first frame is already right (the head script set every variable), so
// the animated scene can wait until the page has loaded and painted.
const afterLoad = (fn: () => void) =>
  document.readyState === 'complete' ? idle(fn) : addEventListener('load', () => idle(fn), { once: true });

afterLoad(() => {
  const scene = startScene(hero);
  for (const el of hero.querySelectorAll('[data-egg]')) el.addEventListener('click', () => theme.nextPhase());
  if (!reducedMotion && !finePointer) startDeviceTilt(scene.setTilt);
});

// Everything below the fold, or only reachable by pointer, starts when the main thread is free.
idle(() => {
  startPipeline();
  if (reducedMotion) return;
  startReveal();
  if (finePointer) {
    startCursor(hero);
    startMagnetic();
    startTilt();
    startScramble();
  }
});

if (import.meta.env.DEV) {
  import('./dev/debug').then((m) => m.startDebug());
}
