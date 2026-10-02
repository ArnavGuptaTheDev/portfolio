import { gsap } from 'gsap';

/** Splits each heading into letters (keeping the real text for screen readers) and reveals them on scroll. */
export function startReveal() {
  const heads = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  for (const h of heads) {
    const text = h.textContent ?? '';
    h.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'reveal-char';
      s.textContent = ch;
      vis.append(s);
    }
    h.append(sr, vis);
    gsap.set(vis.children, { yPercent: 60, opacity: 0 });
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        gsap.to(e.target.querySelectorAll('.reveal-char'), {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.028,
        });
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  heads.forEach((h) => io.observe(h));
}
