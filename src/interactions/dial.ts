import { colorAt } from '../engine/engine';
import { PHASE_LABEL } from '../engine/phases';
import { theme } from '../runtime/theme';

const fmt = (m: number) => {
  const total = Math.floor(m) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Midnight sits at the bottom of the dial, noon at the top.
const angleOf = (minutes: number) => 180 + (minutes / 1440) * 360;

export function startDial() {
  const root = document.querySelector<HTMLElement>('[data-dial]');
  if (!root) return;
  const face = root.querySelector<HTMLElement>('.dial-face')!;
  const ring = root.querySelector<HTMLElement>('.dial-ring')!;
  const knob = root.querySelector<HTMLElement>('.dial-knob')!;
  const phase = root.querySelector<HTMLElement>('.dial-phase')!;
  const time = root.querySelector<HTMLElement>('.dial-time')!;
  const now = root.querySelector<HTMLButtonElement>('.dial-now')!;

  let ringDay = '';
  function paintRing() {
    const day = new Date().toDateString();
    if (day === ringDay) return;
    ringDay = day;
    const stops: string[] = [];
    for (let h = 0; h <= 24; h++) stops.push(`${colorAt('sky1', h * 60, theme.windows)} ${h * 15}deg`);
    ring.style.background = `conic-gradient(from 180deg, ${stops.join(', ')})`;
  }

  let lastMinute = -1;
  theme.subscribe((s) => {
    paintRing();
    face.style.setProperty('--dial-angle', `${angleOf(s.minutes).toFixed(1)}deg`);
    knob.style.background = s.sun.alt > 0 ? 'var(--sun)' : '#f6f1df';
    now.hidden = theme.live;
    const minute = Math.floor(s.minutes);
    if (minute === lastMinute) return;
    lastMinute = minute;
    const label = PHASE_LABEL[s.phase];
    phase.textContent = label;
    time.textContent = fmt(s.minutes);
    face.setAttribute('aria-valuenow', String(minute));
    face.setAttribute('aria-valuetext', `${fmt(s.minutes)}, ${label.toLowerCase()}`);
  });

  const minutesAt = (e: PointerEvent) => {
    const r = face.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return ((((deg - 180) % 360) + 360) % 360) * 4;
  };

  face.addEventListener('pointerdown', (e) => {
    face.setPointerCapture(e.pointerId);
    theme.goTo(minutesAt(e), 0.35);
    const move = (ev: PointerEvent) => theme.scrub(minutesAt(ev));
    const up = () => {
      face.removeEventListener('pointermove', move);
      face.removeEventListener('pointerup', up);
      face.removeEventListener('pointercancel', up);
    };
    face.addEventListener('pointermove', move);
    face.addEventListener('pointerup', up);
    face.addEventListener('pointercancel', up);
  });

  face.addEventListener('keydown', (e) => {
    const step: Record<string, number> = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 };
    if (e.key in step) {
      e.preventDefault();
      theme.goTo(theme.state.minutes + step[e.key], 0.35);
    } else if (e.key === 'Home') {
      e.preventDefault();
      theme.backToNow();
    }
  });

  now.addEventListener('click', () => {
    theme.backToNow();
    face.focus();
  });
}
