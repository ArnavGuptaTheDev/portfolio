const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** A short text scramble on hover. Letters are width-locked so nothing reflows. */
export function startScramble() {
  const el = document.querySelector<HTMLElement>('[data-scramble]');
  if (!el) return;
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars = [...text].map((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.setAttribute('aria-hidden', 'true');
    s.style.display = 'inline-block';
    s.style.whiteSpace = 'pre';
    s.style.textAlign = 'center';
    el.append(s);
    return { s, ch };
  });
  const lock = () => {
    chars.forEach(({ s }) => (s.style.width = ''));
    chars.forEach(({ s }) => (s.style.width = `${s.getBoundingClientRect().width}px`));
  };
  document.fonts.ready.then(lock);
  addEventListener('resize', lock, { passive: true });

  let running = false;
  el.addEventListener('pointerenter', () => {
    if (running) return;
    running = true;
    const start = performance.now();
    const step = (now: number) => {
      const t = (now - start) / 550;
      chars.forEach(({ s, ch }, i) => {
        const settled = t > i / chars.length;
        s.textContent = ch === ' ' || settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });
      if (t < 1) requestAnimationFrame(step);
      else running = false;
    };
    requestAnimationFrame(step);
  });
}
