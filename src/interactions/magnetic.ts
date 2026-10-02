import { gsap } from 'gsap';

const PULL = 0.28;
const MAX = 10;

export function startMagnetic() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnetic]')) {
    const toX = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const toY = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * PULL;
      const dy = (e.clientY - (r.top + r.height / 2)) * PULL;
      toX(Math.max(-MAX, Math.min(MAX, dx)));
      toY(Math.max(-MAX, Math.min(MAX, dy)));
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)', overwrite: true });
    });
  }
}
