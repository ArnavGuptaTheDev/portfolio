import type { SceneState } from '../engine/engine';
import { rng } from './geometry';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  freq: number;
  phase: number;
  milky: boolean;
}

interface Shooting {
  x: number;
  y: number;
  dx: number;
  dy: number;
  born: number;
}

export interface StarView {
  /** viewBox → CSS px */
  scale: number;
  x0: number;
  y0: number;
  /** Parallax offset in viewBox units. */
  ox: number;
  oy: number;
}

const MIN_SHOOTING_GAP = 20_000;

export function createStars(canvas: HTMLCanvasElement, count: number, dprCap: number) {
  const ctx = canvas.getContext('2d')!;
  const rand = rng(2024);
  const stars: Star[] = [];
  const plain = Math.round(count * 0.75);
  for (let i = 0; i < count; i++) {
    const milky = i >= plain;
    let x: number;
    let y: number;
    if (milky) {
      // Scatter along the milky-way band (rotated -24° about 820,300).
      const u = (rand() - 0.5) * 1900;
      const v = (rand() + rand() + rand() - 1.5) * 70;
      const a = (-24 * Math.PI) / 180;
      x = 820 + u * Math.cos(a) - v * Math.sin(a);
      y = 300 + u * Math.sin(a) + v * Math.cos(a);
    } else {
      x = -60 + rand() * 1720;
      y = 660 * rand() ** 1.35;
    }
    stars.push({
      x,
      y,
      size: milky ? 0.5 + rand() * 0.7 : 0.6 + rand() ** 3 * 1.6,
      alpha: 0.35 + rand() * 0.65,
      freq: 0.0004 + rand() * 0.0026,
      phase: rand() * Math.PI * 2,
      milky,
    });
  }

  let w = 0;
  let h = 0;
  let dpr = 1;
  let shooting: Shooting | null = null;
  let lastShooting = -MIN_SHOOTING_GAP;
  let cleared = false;

  function resize(cw: number, ch: number) {
    dpr = Math.min(dprCap, devicePixelRatio || 1);
    w = cw;
    h = ch;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    cleared = false;
  }

  function draw(now: number, s: SceneState, view: StarView, cursor: { x: number; y: number } | null, animate: boolean) {
    const vis = s.num.stars;
    if (vis < 0.01 && !shooting) {
      if (!cleared) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cleared = true;
      }
      return;
    }
    cleared = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const speed = s.num.speed;
    const lantern = cursor && vis > 0.3 && (s.phase === 'night' || s.phase === 'midnight' || s.phase === 'dusk');
    const near: { x: number; y: number; k: number }[] = [];

    for (const st of stars) {
      const base = st.milky ? s.num.milky : 1;
      if (base < 0.02) continue;
      const px = (st.x + view.ox - view.x0) * view.scale;
      const py = (st.y + view.oy - view.y0) * view.scale;
      if (px < -4 || px > w + 4 || py < -4 || py > h + 4) continue;
      const tw = animate ? 0.7 + 0.3 * Math.sin(now * st.freq * speed + st.phase) : 0.85;
      let a = st.alpha * tw * vis * base;
      let size = st.size;
      if (lantern) {
        const d = Math.hypot(px - cursor!.x, py - cursor!.y);
        if (d < 170) {
          const k = 1 - d / 170;
          a = Math.min(1, a + k * 0.55 * vis);
          size *= 1 + k * 0.6;
          if (d < 120 && !st.milky) near.push({ x: px, y: py, k: 1 - d / 120 });
        }
      }
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      if (size < 1.1) ctx.fillRect(px - size / 2, py - size / 2, size, size);
      else {
        ctx.beginPath();
        ctx.arc(px, py, size / 2 + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (lantern && near.length) {
      // Constellation: the cursor to each nearby star, then a chain between them by angle.
      const c = cursor!;
      near.sort((p, q) => Math.atan2(p.y - c.y, p.x - c.x) - Math.atan2(q.y - c.y, q.x - c.x));
      ctx.strokeStyle = '#ffe7b8';
      ctx.lineWidth = 0.7;
      for (const p of near) {
        ctx.globalAlpha = p.k * 0.38 * vis;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      for (let i = 1; i < near.length; i++) {
        const p = near[i - 1];
        const q = near[i];
        if (Math.hypot(p.x - q.x, p.y - q.y) > 110) continue;
        ctx.globalAlpha = Math.min(p.k, q.k) * 0.3 * vis;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    if (animate) drawShooting(now, s);
    ctx.globalAlpha = 1;
  }

  function drawShooting(now: number, s: SceneState) {
    if (!shooting && s.num.shooting > 0.3 && now - lastShooting > MIN_SHOOTING_GAP && Math.random() < 0.004 * s.num.shooting) {
      const fromLeft = Math.random() < 0.5;
      const ang = ((fromLeft ? 25 : 155) + (Math.random() - 0.5) * 20) * (Math.PI / 180);
      shooting = {
        x: w * (0.15 + Math.random() * 0.7),
        y: h * (0.05 + Math.random() * 0.3),
        dx: Math.cos(ang),
        dy: Math.sin(ang),
        born: now,
      };
      lastShooting = now;
    }
    if (!shooting) return;
    const t = (now - shooting.born) / 1100;
    if (t >= 1) {
      shooting = null;
      return;
    }
    const travel = 260 * t;
    const len = 140 * Math.sin(Math.PI * t);
    const hx = shooting.x + shooting.dx * travel;
    const hy = shooting.y + shooting.dy * travel;
    const g = ctx.createLinearGradient(hx, hy, hx - shooting.dx * len, hy - shooting.dy * len);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = Math.sin(Math.PI * t) * s.num.stars;
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - shooting.dx * len, hy - shooting.dy * len);
    ctx.stroke();
  }

  return { resize, draw };
}
