/**
 * Hand-drawn annotation arrows (the Vox reference). Points are fractions 0..1 of the container box;
 * the SVG fills the container (position:absolute inset 0), so give the container a size and position.
 * - createArrow(el, { from, to, curve?, color? }): one arrow; set(t) draws it toward `to` by stroke-dashoffset.
 * - createArrows(el, origins[], { target?, color? }): several arrows converging on one point, staggered.
 * Wobble comes from a seeded PRNG, so every render is identical.
 */
import './gfx.css';
import { clamp01, createPlayer, observeSize, seeded, svgEl, type GfxHandle } from './motion';

export type ArrowColor = 'chalk' | 'ink' | 'blue' | 'sun';
export interface ArrowPoint { x: number; y: number }
export interface ArrowOpts {
  from: ArrowPoint;
  to: ArrowPoint;
  /** Perpendicular bow as a fraction of the arrow length (default 0.18; negative bows the other way). */
  curve?: number;
  color?: ArrowColor;
  /** Stop short of `to` by this fraction of the length (default 0.08). */
  standoff?: number;
  seed?: number;
  /** play() duration in ms (default 800). */
  duration?: number;
}
export interface ArrowsOpts {
  target?: ArrowPoint;
  color?: ArrowColor;
  standoff?: number;
  seed?: number;
  /** play() duration in ms (default 900 + 180ms per extra arrow). */
  duration?: number;
}

interface ArrowSpec { from: ArrowPoint; to: ArrowPoint; curve: number; standoff: number; seed: number; window: [number, number] }
interface ArrowNodes { spec: ArrowSpec; shaft: SVGPathElement; shaft2: SVGPathElement; head: SVGPathElement }

const HEAD_LEN = 16, HEAD_ANGLE = 0.46, SAMPLES = 36;

function build(root: SVGSVGElement, color: ArrowColor, spec: ArrowSpec): ArrowNodes {
  const g = svgEl('g', {}, root);
  const shaft2 = svgEl('path', { class: 'gfx-arrow gfx-arrow--pass2', 'data-color': color, pathLength: 1 }, g);
  const shaft = svgEl('path', { class: 'gfx-arrow', 'data-color': color, pathLength: 1 }, g);
  const head = svgEl('path', { class: 'gfx-arrow', 'data-color': color, pathLength: 1 }, g);
  return { spec, shaft, shaft2, head };
}

/** Lay out one arrow in pixels: a bowed quadratic with seeded perpendicular wobble, plus an open head. */
function layout(n: ArrowNodes, W: number, H: number): void {
  const { from, to, curve, standoff, seed } = n.spec;
  const rnd = seeded(seed);
  const ax = from.x * W, ay = from.y * H;
  const bx0 = to.x * W, by0 = to.y * H;
  const dx = bx0 - ax, dy = by0 - ay;
  const len = Math.hypot(dx, dy) || 1;
  const bx = bx0 - dx * standoff, by = by0 - dy * standoff;
  const nx = -dy / len, ny = dx / len;
  const cx = (ax + bx) / 2 + nx * curve * len, cy = (ay + by) / 2 + ny * curve * len;
  const f1 = 2 + rnd() * 2, f2 = 5 + rnd() * 3, ph1 = rnd() * 6.28, ph2 = rnd() * 6.28, amp = 1.2 + rnd() * 1.2;
  const pts: [number, number][] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const x = (1 - u) ** 2 * ax + 2 * (1 - u) * u * cx + u * u * bx;
    const y = (1 - u) ** 2 * ay + 2 * (1 - u) * u * cy + u * u * by;
    const w = Math.sin(u * f1 * 3.14 + ph1) * amp + Math.sin(u * f2 * 3.14 + ph2) * amp * 0.5;
    const fade = Math.sin(u * 3.14); // steady at both ends
    pts.push([x + nx * w * fade, y + ny * w * fade]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  n.shaft.setAttribute('d', d);
  n.shaft2.setAttribute('d', d);
  n.shaft2.setAttribute('transform', `translate(${(rnd() * 2.4 - 1.2).toFixed(2)} ${(rnd() * 2.4 - 1.2).toFixed(2)})`);
  // Head: open V along the end tangent.
  const [px, py] = pts[SAMPLES - 2];
  const [ex, ey] = pts[SAMPLES];
  const ang = Math.atan2(ey - py, ex - px);
  const l = HEAD_LEN * (0.9 + rnd() * 0.3);
  const a1 = ang + Math.PI - HEAD_ANGLE, a2 = ang + Math.PI + HEAD_ANGLE;
  n.head.setAttribute('d', `M${(ex + Math.cos(a1) * l).toFixed(1)},${(ey + Math.sin(a1) * l).toFixed(1)}L${ex.toFixed(1)},${ey.toFixed(1)}L${(ex + Math.cos(a2) * l).toFixed(1)},${(ey + Math.sin(a2) * l).toFixed(1)}`);
}

function reveal(n: ArrowNodes, p: number): void {
  const [a, b] = n.spec.window;
  const local = clamp01((p - a) / (b - a));
  const shaftT = clamp01(local / 0.85);
  const headT = clamp01((local - 0.85) / 0.15);
  for (const s of [n.shaft, n.shaft2]) {
    if (shaftT >= 1) { s.removeAttribute('stroke-dasharray'); s.removeAttribute('stroke-dashoffset'); }
    else { s.setAttribute('stroke-dasharray', '1'); s.setAttribute('stroke-dashoffset', String(1 - shaftT)); }
  }
  if (headT >= 1) { n.head.removeAttribute('stroke-dasharray'); n.head.removeAttribute('stroke-dashoffset'); n.head.removeAttribute('display'); }
  else if (headT <= 0) n.head.setAttribute('display', 'none');
  else { n.head.removeAttribute('display'); n.head.setAttribute('stroke-dasharray', '1'); n.head.setAttribute('stroke-dashoffset', String(1 - headT)); }
}

function mount(container: HTMLElement, color: ArrowColor, specs: ArrowSpec[], duration: number): GfxHandle {
  const el = document.createElement('div');
  el.className = 'gfx gfx-arrows';
  el.setAttribute('aria-hidden', 'true');
  const svg = svgEl('svg', { preserveAspectRatio: 'none' }, el);
  const nodes = specs.map((s) => build(svg, color, s));
  let W = 0, H = 0;
  const stop = observeSize(el, (w, h) => {
    W = w; H = h;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const n of nodes) layout(n, W, H);
  });
  const player = createPlayer((p) => { for (const n of nodes) reveal(n, p); }, duration);
  player.set(0);
  container.appendChild(el);
  return { el, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); stop(); el.remove(); } };
}

export function createArrow(container: HTMLElement, opts: ArrowOpts): GfxHandle {
  return mount(container, opts.color ?? 'chalk', [{
    from: opts.from, to: opts.to, curve: opts.curve ?? 0.18, standoff: opts.standoff ?? 0.08, seed: opts.seed ?? 3, window: [0, 1],
  }], opts.duration ?? 800);
}

export function createArrows(container: HTMLElement, origins: ArrowPoint[], opts: ArrowsOpts = {}): GfxHandle {
  const target = opts.target ?? { x: 0.5, y: 0.5 };
  const n = Math.max(1, origins.length);
  const stagger = n > 1 ? 0.5 / (n - 1) : 0; // each arrow gets half the timeline, starts spread over the other half
  const specs: ArrowSpec[] = origins.map((from, i) => ({
    from, to: target, curve: (i % 2 ? -1 : 1) * (0.14 + ((i * 7) % 5) * 0.02), standoff: opts.standoff ?? 0.1,
    seed: (opts.seed ?? 5) * 31 + i, window: [i * stagger, i * stagger + 0.5],
  }));
  return mount(container, opts.color ?? 'chalk', specs, opts.duration ?? 900 + 180 * (n - 1));
}
