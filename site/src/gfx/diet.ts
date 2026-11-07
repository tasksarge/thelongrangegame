/**
 * createDiet: a horizontal stacked bar of the four distance shares for one season, as SVG segments
 * filled with halftone dot patterns of increasing density (24+ ft densest) and outlined 1.5px.
 * set(values) morphs the segments over 600ms (ease-out); set(progress) interpolates between
 * opts.from and opts.to for scroll driving. Labels sit below, moved by transform only.
 */
import './gfx.css';
import { createPlayer, htmlEl, lerp, nextId, svgEl, tween, type GfxHandle } from './motion';

export interface DietShares { lt8: number; m8_16: number; m16_24: number; p24: number }
export interface DietOpts {
  from?: DietShares;
  to?: DietShares;
  labels?: Partial<Record<keyof DietShares, string>>;
  /** Hide a label when its segment is narrower than this share in % (default 5). */
  minLabel?: number;
  /** play() duration in ms (default 900). */
  duration?: number;
}
export interface DietHandle extends GfxHandle {
  set(value: number | DietShares): void;
  readonly shares: DietShares;
}

const ZONES: (keyof DietShares)[] = ['lt8', 'm8_16', 'm16_24', 'p24'];
const LABELS: Record<keyof DietShares, string> = { lt8: 'Under 8 ft', m8_16: '8–16 ft', m16_24: '16–24 ft', p24: '24+ ft' };
const DOT_R: Record<keyof DietShares, number> = { lt8: 0.9, m8_16: 1.5, m16_24: 2.1, p24: 2.9 };
const CELL = 7, BAR_H = 44;

export function createDiet(container: HTMLElement, opts: DietOpts = {}): DietHandle {
  const to: DietShares = opts.to ?? { lt8: 32, m8_16: 14, m16_24: 15, p24: 39 };
  const from: DietShares = opts.from ?? to;
  const labels = { ...LABELS, ...opts.labels };
  const minLabel = opts.minLabel ?? 5;
  let shares: DietShares = { ...from };

  const el = htmlEl('div', 'gfx gfx-diet');
  el.setAttribute('role', 'img');
  const svg = svgEl('svg', { class: 'gfx-diet__bar', width: '100%', height: BAR_H }, el);
  const defs = svgEl('defs', {}, svg);
  const labelRow = htmlEl('div', 'gfx-diet__labels', el);
  const segs = {} as Record<keyof DietShares, SVGRectElement>;
  const labelEls = {} as Record<keyof DietShares, { el: HTMLElement; pct: HTMLElement }>;
  for (const z of ZONES) {
    const id = nextId(`diet-${z}`);
    const pat = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: CELL, height: CELL }, defs);
    svgEl('circle', { class: 'gfx-diet__dot', cx: CELL / 2, cy: CELL / 2, r: DOT_R[z] }, pat);
    segs[z] = svgEl('rect', { class: 'gfx-diet__seg', y: 0.75, height: BAR_H - 1.5, x: '0%', width: '0%', fill: `url(#${id})` }, svg);
    segs[z].dataset.zone = z;
    const label = htmlEl('span', 'gfx-diet__label', labelRow);
    label.dataset.row = String(ZONES.indexOf(z) % 2); // alternate rows so narrow neighbours never collide
    const pct = htmlEl('b', undefined, label);
    label.appendChild(document.createTextNode(labels[z]));
    labelEls[z] = { el: label, pct };
  }

  const drawn: DietShares = { ...shares };
  const paint = (v: DietShares): void => {
    const total = ZONES.reduce((s, z) => s + Math.max(0, v[z]), 0) || 1;
    let start = 0;
    const parts: string[] = [];
    for (const z of ZONES) {
      const share = Math.max(0, v[z]) / total;
      segs[z].setAttribute('x', `${(start * 100).toFixed(3)}%`);
      segs[z].setAttribute('width', `${(share * 100).toFixed(3)}%`);
      labelEls[z].el.style.transform = `translateX(${(start * 100).toFixed(3)}%)`;
      labelEls[z].el.style.opacity = share * 100 < minLabel ? '0' : '1';
      labelEls[z].pct.textContent = `${Math.round(share * 100)}%`;
      parts.push(`${labels[z]} ${Math.round(share * 100)}%`);
      start += share;
    }
    el.setAttribute('aria-label', parts.join(', '));
    Object.assign(drawn, v);
  };
  let cancelMorph = (): void => {};
  const morph = (target: DietShares): void => {
    cancelMorph();
    const start = { ...drawn };
    cancelMorph = tween(600, (u) => paint({
      lt8: lerp(start.lt8, target.lt8, u), m8_16: lerp(start.m8_16, target.m8_16, u),
      m16_24: lerp(start.m16_24, target.m16_24, u), p24: lerp(start.p24, target.p24, u),
    }));
  };
  const player = createPlayer((p) => {
    cancelMorph();
    shares = {
      lt8: lerp(from.lt8, to.lt8, p), m8_16: lerp(from.m8_16, to.m8_16, p),
      m16_24: lerp(from.m16_24, to.m16_24, p), p24: lerp(from.p24, to.p24, p),
    };
    paint(shares);
  }, opts.duration ?? 900);
  player.set(0);

  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: (value) => {
      if (typeof value === 'number') { player.set(value); return; }
      player.pause();
      shares = { ...value };
      morph(shares);
    },
    get shares() { return shares; },
    destroy: () => { player.destroy(); cancelMorph(); el.remove(); },
  };
}
