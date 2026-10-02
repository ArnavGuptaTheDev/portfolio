import { gsap } from 'gsap';

const MAX_DEG = 7;

export function startTilt() {
  for (const card of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rx((0.5 - py) * MAX_DEG);
      ry((px - 0.5) * MAX_DEG * 1.2);
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      card.style.setProperty('--hl', '1');
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
      card.style.setProperty('--hl', '0');
    });
  }
}
