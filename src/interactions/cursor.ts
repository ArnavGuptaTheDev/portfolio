import { onFrame } from '../runtime/loop';
import { pointer } from '../runtime/pointer';

const INTERACTIVE = 'a, button, [role="slider"], [data-egg], input, label';
const TEXT = 'p, dd, li, h1, h2, h3';

export function startCursor(hero: HTMLElement) {
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el) return;
  const dot = el.querySelector<HTMLElement>('.cursor-dot')!;
  const ring = el.querySelector<HTMLElement>('.cursor-ring')!;
  document.documentElement.classList.add('has-cursor');

  const r = { x: pointer.x, y: pointer.y };
  let heroBottom = hero.offsetHeight;

  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const hover = !!t.closest(INTERACTIVE);
    el.classList.toggle('hover', hover);
    el.classList.toggle('text', !hover && !!t.closest(TEXT));
  });
  document.documentElement.addEventListener('pointerleave', () => el.classList.add('hidden'));
  document.documentElement.addEventListener('pointerenter', () => el.classList.remove('hidden'));
  addEventListener('resize', () => (heroBottom = hero.offsetHeight), { passive: true });

  onFrame(() => {
    el.classList.toggle('live', pointer.active);
    if (!pointer.active) return;
    r.x += (pointer.x - r.x) * 0.2;
    r.y += (pointer.y - r.y) * 0.2;
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.transform = `translate3d(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px, 0)`;
    el.classList.toggle('on-hero', pointer.y + scrollY < heroBottom);
  });
}
