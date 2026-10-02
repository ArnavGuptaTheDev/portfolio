import type { SceneState } from '../engine/engine';
import { visibleBox } from '../engine/vars';
import { getCoords } from '../engine/clock';
import { finePointer, lowEnd, mobile, quality, reducedMotion } from '../runtime/device';
import { onFrame } from '../runtime/loop';
import { pointer } from '../runtime/pointer';
import { theme } from '../runtime/theme';
import { moonPath } from './moon';
import { rng } from './geometry';
import { createStars } from './stars';

const PARALLAX_X = 26;
const PARALLAX_Y = 12;
const LERP = 0.08;

export function startScene(hero: HTMLElement) {
  const scene = hero.querySelector<HTMLElement>('.scene')!;
  const land = scene.querySelector<SVGSVGElement>('.scene-land')!;
  const canvas = scene.querySelector<HTMLCanvasElement>('.scene-stars')!;
  const layers = [...scene.querySelectorAll<SVGGElement>('[data-depth]')].map((el) => ({
    el,
    depth: Number(el.dataset.depth),
  }));
  const clouds = [...scene.querySelectorAll<SVGGElement>('.cloud')].map((el) => ({
    el,
    x: Number(el.dataset.x),
    y: Number(el.getAttribute('transform')!.match(/ ([\d.]+)\)/)![1]),
    w: Number(el.dataset.w),
    s: Number(el.dataset.s),
  }));
  const mists = [...scene.querySelectorAll<SVGEllipseElement>('.mist')].map((el, i) => ({ el, s: Number(el.dataset.s), i }));
  const curtains = [...scene.querySelectorAll<SVGPathElement>('.aurora-curtain')];
  const sparkles = [...scene.querySelectorAll<SVGPathElement>('.sparkle')];
  const windows = [...scene.querySelectorAll<SVGRectElement>('.win')].map((el) => ({ el, rank: Number(el.dataset.r), on: false }));
  const flock = scene.querySelector<SVGGElement>('.flock')!;
  const birds = [...flock.querySelectorAll<SVGPathElement>('.bird')];
  const birdBase = birds.map((b) => b.getAttribute('transform')!);
  const noise = scene.querySelector<SVGFETurbulenceElement>('.shimmer-noise')!;
  const moonLit = scene.querySelector<SVGPathElement>('.moon-lit')!;
  const moonDark = scene.querySelector<SVGCircleElement>('.moon-dark')!;

  const fireflyEls = [...scene.querySelectorAll<SVGGElement>('.firefly')];
  const maxFireflies = Math.round(fireflyEls.length * quality);
  fireflyEls.slice(maxFireflies).forEach((el) => el.remove());
  const rand = rng(7);
  const fireflies = fireflyEls.slice(0, maxFireflies).map((el, i) => ({
    el,
    x: rand() * 1600,
    y: 660 + rand() * 200,
    vx: 0,
    vy: 0,
    seed: rand() * 100,
    alpha: 0,
    rank: i / maxFireflies,
  }));

  const stars = createStars(canvas, Math.round(420 * quality), lowEnd ? 1 : 1.5);
  const shimmerAllowed = !reducedMotion && !mobile && !lowEnd;

  let box = visibleBox(1600, 900);
  let w = 0;
  let h = 0;
  let visible = true;
  let state: SceneState = theme.state;
  // Smoothed parallax input, -1..1.
  const par = { x: 0, y: 0 };
  let tilt: { x: number; y: number } | null = null;
  let flight: { start: number; y: number; dir: 1 | -1 } | null = null;
  let nextFlight = performance.now() + 4000;
  let lastShimmer = 0;
  let lastFlicker = 0;
  const flicker = new Map<number, number>();
  let moonDay = '';

  function resize() {
    const r = scene.getBoundingClientRect();
    w = r.width;
    h = r.height;
    box = visibleBox(w, h);
    stars.resize(w, h);
    const copy = hero.querySelector('.hero-copy')!.getBoundingClientRect();
    const top = r.top;
    theme.setViewport(w, h, { left: copy.left, right: copy.right, top: copy.top - top, bottom: copy.bottom - top });
  }

  function updateMoon() {
    const day = new Date().toDateString();
    if (day === moonDay) return;
    moonDay = day;
    const southern = (getCoords()?.[0] ?? 1) < 0;
    moonLit.setAttribute('d', moonPath(24, new Date(), southern));
    moonDark.setAttribute('r', '24');
  }

  function updateWindows(now: number) {
    const lit = state.num.windows;
    // At night a few windows switch on and off at random.
    if (!reducedMotion && lit > 0.08 && lit < 0.95 && now - lastFlicker > 1400 / Math.max(0.3, state.num.speed)) {
      lastFlicker = now;
      const i = Math.floor(Math.random() * windows.length);
      flicker.set(i, now + 4000 + Math.random() * 9000);
    }
    windows.forEach((win, i) => {
      let on = win.rank < lit;
      const until = flicker.get(i);
      if (until !== undefined) {
        if (until < now) flicker.delete(i);
        else on = !on;
      }
      if (on !== win.on) {
        win.on = on;
        win.el.classList.toggle('on', on);
      }
    });
  }

  function updateBirds(now: number) {
    const amount = state.num.birds;
    if (!flight) {
      if (amount > 0.08 && now > nextFlight) {
        flight = { start: now, y: 200 + Math.random() * 170, dir: Math.random() < 0.7 ? 1 : -1 };
      } else {
        flock.style.opacity = '0';
        return;
      }
    }
    const dur = 26_000;
    const t = (now - flight.start) / dur;
    if (t >= 1) {
      flight = null;
      // Busier skies at dawn, the odd bird at noon.
      nextFlight = now + (8000 + Math.random() * 16000) / Math.max(0.15, amount);
      flock.style.opacity = '0';
      return;
    }
    const span = box.x1 - box.x0 + 200;
    const x = flight.dir > 0 ? box.x0 - 100 + span * t : box.x1 + 100 - span * t;
    const y = flight.y + Math.sin(t * 9) * 10 - t * 40;
    flock.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${flight.dir}, 1)`;
    flock.style.opacity = String(Math.min(1, amount * 1.6) * Math.min(1, t * 12, (1 - t) * 12));
    birds.forEach((b, i) => {
      const flap = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.011 + i * 1.7));
      b.setAttribute('transform', `${birdBase[i]} scale(1 ${flap.toFixed(2)})`);
    });
  }

  function updateFireflies(now: number, dt: number) {
    const want = state.num.fireflies;
    const speed = state.num.speed;
    for (const f of fireflies) {
      // Each firefly has its own threshold, so they arrive one at a time as night deepens.
      const target = f.rank < want ? 1 : 0;
      f.alpha += (target - f.alpha) * Math.min(1, dt * 0.0012);
      if (f.alpha < 0.01) {
        f.el.style.opacity = '0';
        continue;
      }
      if (!reducedMotion) {
        f.vx += (Math.sin(now * 0.0007 + f.seed) * 0.6 - f.vx) * 0.02;
        f.vy += (Math.cos(now * 0.0009 + f.seed * 1.3) * 0.35 - f.vy) * 0.02;
        f.x += f.vx * dt * 0.05 * speed;
        f.y += f.vy * dt * 0.05 * speed;
        if (f.x < box.x0 - 20) f.x = box.x1 + 10;
        if (f.x > box.x1 + 20) f.x = box.x0 - 10;
        f.y = Math.min(870, Math.max(640, f.y));
      }
      const blink = reducedMotion ? 0.8 : 0.35 + 0.65 * Math.max(0, Math.sin(now * 0.002 + f.seed)) ** 2;
      f.el.style.transform = `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px)`;
      f.el.style.opacity = (f.alpha * blink).toFixed(3);
    }
  }

  function render(now: number, dt: number) {
    const animate = !reducedMotion;
    const speed = state.num.speed;

    // Parallax: pointer on desktop, device tilt or a slow drift on touch.
    let tx = 0;
    let ty = 0;
    if (animate) {
      if (finePointer && pointer.active) {
        tx = pointer.nx;
        ty = pointer.ny;
      } else if (tilt) {
        tx = tilt.x;
        ty = tilt.y;
      } else if (!finePointer) {
        tx = Math.sin(now * 0.00018) * 0.6;
        ty = Math.cos(now * 0.00013) * 0.3;
      }
      par.x += (tx - par.x) * LERP;
      par.y += (ty - par.y) * LERP;
      for (const l of layers) {
        l.el.style.transform = `translate(${(-par.x * l.depth * PARALLAX_X).toFixed(2)}px, ${(-par.y * l.depth * PARALLAX_Y).toFixed(2)}px)`;
      }

      for (const c of clouds) {
        c.x += dt * 0.004 * c.s * speed;
        if (c.x > box.x1 + 60) c.x = box.x0 - c.w - 60;
        c.el.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y})`);
      }

      // Mist drifts sideways and lifts as it thins out after dawn.
      const lift = (1 - Math.min(1, state.num.mist / 0.85)) * 36;
      for (const m of mists) {
        const dx = Math.sin(now * 0.00005 * m.s * speed + m.i * 2) * 60;
        m.el.style.transform = `translate(${dx.toFixed(1)}px, ${(-lift * m.s).toFixed(1)}px)`;
      }

      if (state.num.aurora > 0.02) {
        curtains.forEach((c, i) => {
          const sway = Math.sin(now * 0.00011 * speed + i * 1.9) * 40;
          const skew = Math.sin(now * 0.00017 * speed + i) * 6;
          c.style.transform = `translateX(${sway.toFixed(1)}px) skewX(${skew.toFixed(2)}deg)`;
          c.style.opacity = (0.55 + 0.45 * Math.sin(now * 0.0004 + i * 2.3)).toFixed(3);
        });
      }

      if (state.num.dew > 0.02) {
        sparkles.forEach((s, i) => {
          const k = Math.max(0, Math.sin(now * (0.0011 + (i % 5) * 0.00031) + i * 2.1)) ** 10;
          s.style.opacity = (k * state.num.dew).toFixed(3);
        });
      }

      const shimmer = shimmerAllowed && state.num.shimmer > 0.05;
      land.classList.toggle('shimmer-on', shimmer);
      if (shimmer && now - lastShimmer > 120) {
        lastShimmer = now;
        noise.setAttribute('baseFrequency', `0.004 ${(0.07 + Math.sin(now * 0.0012) * 0.015).toFixed(4)}`);
      }

      updateBirds(now);
    }

    updateFireflies(now, dt);
    updateWindows(now);

    // The hero starts at the top of the page; the scene itself sinks by 0.35× the scroll.
    const cursor = finePointer && pointer.active ? { x: pointer.x, y: pointer.y + scrollY * 0.65 } : null;
    stars.draw(now, state, { scale: box.scale, x0: box.x0, y0: box.y0, ox: -par.x * 0.06 * PARALLAX_X, oy: -par.y * 0.06 * PARALLAX_Y }, cursor, animate);
  }

  // Scroll: the scene sinks and fades as the hero leaves.
  let scrollY = -1;
  function updateScroll() {
    const y = window.scrollY;
    if (y === scrollY) return;
    scrollY = y;
    const k = Math.min(1, y / Math.max(1, h));
    scene.style.transform = reducedMotion ? '' : `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
    scene.style.opacity = (1 - k * 0.85).toFixed(3);
  }

  resize();
  updateMoon();
  addEventListener('resize', resize, { passive: true });
  theme.subscribe((s) => {
    state = s;
    updateMoon();
  });

  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  if (reducedMotion) {
    // One still frame per state change: right colours, nothing moving.
    theme.subscribe(() => requestAnimationFrame((t) => render(t, 0)));
    return { setTilt() {} };
  }

  onFrame((now, dt) => {
    updateScroll();
    if (!visible) return;
    render(now, dt);
  });

  return {
    setTilt(t: { x: number; y: number } | null) {
      tilt = t;
    },
  };
}
