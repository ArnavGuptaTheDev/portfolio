import { computeState } from '../engine/engine';
import { PHASE_LABEL } from '../engine/phases';
import { realMinutes } from '../engine/time';
import { theme } from '../runtime/theme';

/** "It's dusk where you are, 18:42" — always the visitor's real time, even while the dial is scrubbed. */
export function startFooter() {
  const el = document.querySelector<HTMLElement>('.phase-line');
  if (!el) return;
  const update = () => {
    const m = realMinutes();
    const s = computeState(m, theme.windows);
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(Math.floor(m % 60)).padStart(2, '0');
    const name = s.phase === 'day' ? 'daytime' : PHASE_LABEL[s.phase].toLowerCase();
    el.textContent = `It’s ${name} where you are, ${hh}:${mm}`;
  };
  update();
  setInterval(update, 30_000);
}
