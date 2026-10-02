type Frame = (now: number, dt: number) => void;

const frames = new Set<Frame>();
let raf = 0;
let last = 0;

function tick(now: number) {
  // Clamp dt so a long frame (or a tab coming back) never makes things jump.
  const dt = Math.min(50, now - last);
  last = now;
  for (const f of frames) f(now, dt);
  raf = requestAnimationFrame(tick);
}

function start() {
  if (raf || document.hidden || frames.size === 0) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

/** Joins the single shared rAF loop. Returns an unsubscribe function. */
export function onFrame(f: Frame): () => void {
  frames.add(f);
  start();
  return () => {
    frames.delete(f);
    if (frames.size === 0) stop();
  };
}
