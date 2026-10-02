import { onFrame } from '../runtime/loop';
import { reducedMotion } from '../runtime/device';

const NS = 'http://www.w3.org/2000/svg';
const PULSES = 3;

/** The experience list as a data pipeline: a path that draws with scroll, with packets flowing down it. */
export function startPipeline() {
  const list = document.querySelector<HTMLElement>('[data-pipeline]');
  if (!list) return;
  const stages = [...list.querySelectorAll<HTMLElement>('.stage')];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pipeline-svg');
  svg.setAttribute('aria-hidden', 'true');
  const track = document.createElementNS(NS, 'path');
  track.setAttribute('class', 'pipeline-track');
  const flow = document.createElementNS(NS, 'path');
  flow.setAttribute('class', 'pipeline-flow');
  const pulses = Array.from({ length: PULSES }, () => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'pipeline-pulse');
    c.setAttribute('r', '3.5');
    return c;
  });
  svg.append(track, flow, ...pulses);
  list.prepend(svg);

  let length = 0;
  let nodeY: number[] = [];
  let drawn = 0;
  let visible = false;

  function layout() {
    const top = list!.getBoundingClientRect().top;
    nodeY = stages.map((s) => s.querySelector('.stage-node')!.getBoundingClientRect().top - top + 16);
    const height = list!.offsetHeight;
    svg.setAttribute('viewBox', `0 0 32 ${height}`);
    svg.style.height = `${height}px`;
    // A gentle S between each pair of nodes, like a pipe routed between stages.
    let d = `M16,${nodeY[0]}`;
    for (let i = 1; i < nodeY.length; i++) {
      const a = nodeY[i - 1];
      const b = nodeY[i];
      const bend = i % 2 ? 9 : -9;
      d += `C${16 + bend},${a + (b - a) * 0.35} ${16 - bend},${a + (b - a) * 0.65} 16,${b}`;
    }
    track.setAttribute('d', d);
    flow.setAttribute('d', d);
    length = flow.getTotalLength();
    flow.style.strokeDasharray = `${length}`;
    update();
  }

  function update() {
    const r = list!.getBoundingClientRect();
    const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    drawn = length * progress;
    flow.style.strokeDashoffset = `${length - drawn}`;
    stages.forEach((s, i) => s.classList.toggle('reached', nodeY[i] <= progress * r.height + 4));
  }

  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', layout, { passive: true });
  document.fonts.ready.then(layout);
  layout();

  if (reducedMotion) {
    pulses.forEach((p) => p.remove());
    return;
  }
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(list);
  onFrame((now) => {
    if (!visible || drawn < 20) return;
    pulses.forEach((p, i) => {
      const t = (now * 0.00009 + i / PULSES) % 1;
      const pt = flow.getPointAtLength(t * drawn);
      p.setAttribute('cx', pt.x.toFixed(1));
      p.setAttribute('cy', pt.y.toFixed(1));
      p.setAttribute('opacity', Math.min(1, t * 8, (1 - t) * 8).toFixed(2));
    });
  });
}
