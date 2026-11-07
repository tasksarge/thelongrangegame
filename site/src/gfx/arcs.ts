/**
 * createArcs: side view. A faceless shooter and a hoop (ring, backboard, pole) as 2px wireframe
 * outlines in the foreground color. set(t) draws `count` dotted arcs (yellow on the olive ground,
 * blue on paper) one by one from the hand to the hoop with a ball riding the live arc: the
 * long-exposure look for "402 threes". Jitter is seeded, so set(t) is deterministic.
 */
import './gfx.css';
import { clamp01, createPlayer, seeded, svgEl, type GfxHandle } from './motion';

export interface ArcsOpts {
  /** Number of arcs (default 50). */
  count?: number;
  /** play() duration in ms (default 1200 + 10ms per arc, capped at 8000). */
  duration?: number;
  /** PRNG seed for the jitter (default 7). */
  seed?: number;
}
export interface ArcsHandle extends GfxHandle { readonly count: number }

const VW = 600, VH = 320;
const HAND = { x: 166, y: 70 };
const RIM = { x: 518, y: 104 };

interface Arc { el: SVGPathElement; c: { x: number; y: number }; p0: { x: number; y: number }; p1: { x: number; y: number } }

export function createArcs(container: HTMLElement, opts: ArcsOpts = {}): ArcsHandle {
  const count = Math.max(1, Math.floor(opts.count ?? 50));
  const rnd = seeded(opts.seed ?? 7);

  const el = document.createElement('div');
  el.className = 'gfx gfx-arcs';
  const svg = svgEl('svg', { viewBox: `0 0 ${VW} ${VH}`, role: 'img', 'aria-label': `${count} three-point shots drawn as arcs from a shooter to the hoop` }, el);

  // Floor, shooter outline (one silhouette polygon plus head), hoop outline.
  svgEl('path', { class: 'gfx-arcs__floor', d: 'M40,300H560' }, svg);
  const wire = svgEl('g', { class: 'gfx-arcs__wire' }, svg);
  svgEl('circle', { cx: 98, cy: 118, r: 19 }, wire);
  svgEl('polygon', { points: '86,142 112,142 118,148 150,100 158,70 170,74 162,108 130,160 118,170 116,212 136,300 118,300 98,232 80,300 62,300 80,212 74,160' }, wire);
  svgEl('rect', { x: 538, y: 40, width: 8, height: 92 }, wire);
  svgEl('rect', { x: 548, y: 60, width: 12, height: 240 }, wire);
  svgEl('path', { d: 'M504,114 L510,150 M532,114 L526,150 M506,126 H530 M508,138 H528' }, wire);
  svgEl('ellipse', { class: 'gfx-arcs__ring', cx: RIM.x, cy: 110, rx: 16, ry: 5 }, svg);

  const arcsG = svgEl('g', {}, svg);
  const arcs: Arc[] = [];
  for (let i = 0; i < count; i++) {
    const p0 = { x: HAND.x + (rnd() - 0.5) * 6, y: HAND.y + (rnd() - 0.5) * 6 };
    const p1 = { x: RIM.x + (rnd() - 0.5) * 8, y: RIM.y + (rnd() - 0.5) * 4 };
    const apex = 90 + rnd() * 60;
    const c = { x: (p0.x + p1.x) / 2 + (rnd() - 0.5) * 40, y: (p0.y + p1.y) / 2 - apex * 2 + (p0.y - p1.y) / 2 };
    const path = svgEl('path', { class: 'gfx-arcs__arc', d: `M${p0.x.toFixed(1)},${p0.y.toFixed(1)}Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`, display: 'none' }, arcsG);
    arcs.push({ el: path, c, p0, p1 });
  }
  const live = svgEl('path', { class: 'gfx-arcs__arc gfx-arcs__arc--live', d: '', display: 'none' }, svg);
  const ballG = svgEl('g', { display: 'none' }, svg);
  svgEl('circle', { class: 'gfx-arcs__ball', r: 8 }, ballG);
  svgEl('path', { class: 'gfx-arcs__ball', d: 'M-8,0H8M0,-8V8', 'stroke-width': 1.5 }, ballG);

  const at = (a: Arc, u: number): { x: number; y: number } => ({
    x: (1 - u) ** 2 * a.p0.x + 2 * (1 - u) * u * a.c.x + u * u * a.p1.x,
    y: (1 - u) ** 2 * a.p0.y + 2 * (1 - u) * u * a.c.y + u * u * a.p1.y,
  });

  let shown = 0;
  const apply = (p: number): void => {
    const pos = clamp01(p) * count;
    const k = Math.min(count, Math.floor(pos));
    const frac = pos - k;
    if (k !== shown) {
      const lo = Math.min(k, shown), hi = Math.max(k, shown);
      for (let i = lo; i < hi; i++) {
        if (i < k) arcs[i].el.removeAttribute('display'); else arcs[i].el.setAttribute('display', 'none');
      }
      shown = k;
    }
    if (k >= count || frac <= 0) {
      live.setAttribute('display', 'none');
      ballG.setAttribute('display', 'none');
      return;
    }
    const a = arcs[k];
    const n = Math.max(1, Math.ceil(frac * 32));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const q = at(a, (i / n) * frac);
      d += `${i ? 'L' : 'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;
    }
    live.setAttribute('d', d);
    live.removeAttribute('display');
    const b = at(a, frac);
    ballG.setAttribute('transform', `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`);
    ballG.removeAttribute('display');
  };
  const player = createPlayer(apply, opts.duration ?? Math.min(8000, 1200 + count * 10));
  player.set(0);

  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: player.set,
    count,
    destroy: () => { player.destroy(); el.remove(); },
  };
}
