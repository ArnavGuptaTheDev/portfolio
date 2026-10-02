// Dev-only phase inspector. Toggle with the backtick key, or open with ?debug.
import { CSS_VARS } from '../engine/engine';
import { NUM_KEYS, PHASE_LABEL } from '../engine/phases';
import { theme } from '../runtime/theme';

const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

export function startDebug() {
  const panel = document.createElement('aside');
  panel.setAttribute('aria-label', 'Phase debug panel');
  panel.style.cssText =
    'position:fixed;left:12px;top:12px;z-index:9999;width:300px;max-height:calc(100vh - 24px);overflow:auto;padding:12px;' +
    'font:12px/1.4 ui-monospace,monospace;color:#e8eaf6;background:rgba(10,12,28,.88);border:1px solid #333a66;border-radius:12px;' +
    'backdrop-filter:blur(8px)';
  panel.hidden = !new URLSearchParams(location.search).has('debug');
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between"><strong>Phase engine</strong><span data-src></span></div>
    <div data-head style="margin:6px 0"></div>
    <input data-slider type="range" min="0" max="1439" step="1" style="width:100%" aria-label="Scene time">
    <div data-windows style="margin:6px 0;opacity:.75"></div>
    <div data-swatches style="display:grid;grid-template-columns:repeat(2,1fr);gap:3px 8px;margin:8px 0"></div>
    <div data-nums></div>`;
  document.body.append(panel);

  const q = <T extends Element>(s: string) => panel.querySelector<T>(s)!;
  const slider = q<HTMLInputElement>('[data-slider]');
  slider.addEventListener('input', () => theme.scrub(Number(slider.value)));

  theme.subscribe((s) => {
    if (panel.hidden) return;
    const w = s.windows;
    q('[data-src]').textContent = w.source;
    q('[data-head]').innerHTML =
      `<b>${PHASE_LABEL[s.phase]}</b> ${fmt(s.minutes)} · progress ${(s.progress * 100).toFixed(0)}% · ${s.light ? 'light' : 'dark'} · scrim ${s.scrim.toFixed(2)}`;
    if (document.activeElement !== slider) slider.value = String(Math.floor(s.minutes));
    q('[data-windows]').textContent = Object.entries(w.starts)
      .map(([k, v]) => `${k} ${fmt(v)}`)
      .join(' · ');
    q('[data-swatches]').innerHTML = CSS_VARS.map(
      (k) =>
        `<span style="display:flex;gap:6px;align-items:center"><i style="width:14px;height:14px;border-radius:3px;background:${s.colors[k]};outline:1px solid #fff3"></i>${k} ${s.colors[k]}</span>`,
    ).join('');
    q('[data-nums]').innerHTML = NUM_KEYS.map(
      (k) =>
        `<div style="display:flex;gap:6px;align-items:center"><span style="width:70px">${k}</span><i style="height:4px;width:${(Math.abs(s.num[k]) * 150).toFixed(0)}px;background:#9fb3ff"></i>${s.num[k].toFixed(2)}</div>`,
    ).join('');
  });

  addEventListener('keydown', (e) => {
    if (e.key !== '`') return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) theme.scrub(theme.state.minutes);
  });
}
