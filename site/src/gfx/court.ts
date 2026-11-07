/**
 * createCourt: an exact NBA court (94 x 50 ft) as an electric-blue wireframe on a transparent ground
 * (yellow on the olive ground). Coordinates for the public API are feet: x across the width
 * (0..50, hoop at 25), y along the length from the near baseline (0..94); the near hoop is at (25, 5.25).
 * - set(t): draws the lines (stroke-dashoffset), boundary first, arc last.
 * - zones({ lt8, m8_16, m16_24, p24 }): fills the four distance zones with a halftone dot pattern
 *   whose dot radius scales with the share (45% = the densest dots), tweened over 400ms.
 * - shot(from, apex, t): dashed arc from a court position to the hoop with a halftone ball riding it.
 */
import './gfx.css';
import { clamp01, createPlayer, nextId, onInkGround, svgEl, tween, type GfxHandle } from './motion';

export interface CourtOpts {
  view?: 'half' | 'full';
  /** Line color: blue on paper, yellow on ink. Defaults from the nearest `.scene--dark` / `[data-ground="ink"]`. */
  ground?: 'paper' | 'ink';
  /** play() duration in ms (default 1200). */
  duration?: number;
}
export interface ZoneShares { lt8: number; m8_16: number; m16_24: number; p24: number }
export interface CourtPoint { x: number; y: number }
export interface CourtHandle extends GfxHandle {
  zones(values: ZoneShares): void;
  shot(from: CourtPoint, apex: number, t: number): void;
  clearShot(): void;
  /** The near hoop's ring element (also marked `data-hoop`), e.g. as `targetEl` for createArrows. */
  hoopEl(): SVGPathElement;
  /** The near hoop ring's bounding rect in viewport px. */
  hoopRect(): DOMRect;
}

const HOOP_X = 25, HOOP_Y = 5.25, R3 = 23.75, CORNER_X = 3, MARGIN = 2, BALL_R = 1.1;
const CELL = 1.5, DOT_MAX = 0.52, STROKE_PX = 2;
const CORNER_Y = HOOP_Y + Math.sqrt(R3 * R3 - (HOOP_X - CORNER_X) ** 2); // 14.2 ft
const circ = (cx: number, cy: number, r: number): string =>
  `M${cx - r},${cy}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0`;
const INSIDE3 = `M${CORNER_X},0V${CORNER_Y}A${R3},${R3} 0 0 0 ${50 - CORNER_X},${CORNER_Y}V0Z`;
const ZONE_KEYS: (keyof ZoneShares)[] = ['lt8', 'm8_16', 'm16_24', 'p24'];

interface Line { d: string; from: number; to: number; cls?: string }

export function createCourt(container: HTMLElement, opts: CourtOpts = {}): CourtHandle {
  const view = opts.view ?? 'half';
  const ground = opts.ground ?? (onInkGround(container) ? 'ink' : 'paper');
  const length = view === 'half' ? 47 : 94;
  const W = view === 'half' ? 50 + 2 * MARGIN : 94 + 2 * MARGIN;
  const H = view === 'half' ? 47 + 2 * MARGIN : 50 + 2 * MARGIN;

  const el = document.createElement('div');
  el.className = 'gfx gfx-court';
  el.dataset.gfxGround = ground;
  el.dataset.view = view;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `NBA ${view} court` }, el);
  // Feet -> screen. Half: baseline at the bottom (y flipped). Full: length runs left to right.
  const matrix = view === 'half'
    ? `matrix(1 0 0 -1 ${MARGIN} ${47 + MARGIN})`
    : `matrix(0 1 1 0 ${MARGIN} ${MARGIN})`;
  const g = svgEl('g', { transform: matrix }, svg);

  const defs = svgEl('defs', {}, svg);
  const halfClip = nextId('court-half');
  svgEl('rect', { x: 0, y: 0, width: 50, height: 47 }, svgEl('clipPath', { id: halfClip }, defs));
  const insideClip = nextId('court-inside');
  svgEl('path', { d: INSIDE3 }, svgEl('clipPath', { id: insideClip }, defs));
  // One halftone pattern per zone; zones() sets the dot radius.
  const patternIds = {} as Record<keyof ZoneShares, string>;
  const dots = {} as Record<keyof ZoneShares, SVGCircleElement>;
  for (const key of ZONE_KEYS) {
    patternIds[key] = nextId(`court-zone-${key}`);
    const pat = svgEl('pattern', { id: patternIds[key], patternUnits: 'userSpaceOnUse', width: CELL, height: CELL }, defs);
    dots[key] = svgEl('circle', { class: 'gfx-court__dot', cx: CELL / 2, cy: CELL / 2, r: 0 }, pat);
  }
  const ballPatternId = nextId('court-ball');
  const ballPat = svgEl('pattern', { id: ballPatternId, patternUnits: 'userSpaceOnUse', width: 0.42, height: 0.42 }, defs);
  svgEl('circle', { class: 'gfx-court__dot', cx: 0.21, cy: 0.21, r: 0.11 }, ballPat);

  const lineEls: { el: SVGPathElement; from: number; to: number }[] = [];
  const halfLines: Line[] = [
    { d: 'M17,0V19H33V0', from: 0.15, to: 0.45 },
    { d: circ(25, 19, 6), from: 0.3, to: 0.55 },
    { d: `M21,4V${HOOP_Y}A4,4 0 0 0 29,${HOOP_Y}V4`, from: 0.4, to: 0.6 },
    { d: 'M22,4H28', from: 0.4, to: 0.6 },
    { d: circ(HOOP_X, HOOP_Y, 0.75), from: 0.5, to: 0.65, cls: 'gfx-court__hoop' },
    { d: INSIDE3.slice(0, -1), from: 0.45, to: 0.9 },
  ];
  let hoop: SVGPathElement | null = null;
  const addLine = (parent: SVGElement, line: Line): void => {
    const p = svgEl('path', { class: line.cls ?? 'gfx-court__line', d: line.d, pathLength: 1 }, parent);
    if (line.cls === 'gfx-court__hoop' && !hoop) { hoop = p; p.setAttribute('data-hoop', ''); }
    lineEls.push({ el: p, from: line.from, to: line.to });
  };
  const buildHalf = (parent: SVGElement): void => {
    const zones = svgEl('g', { 'clip-path': `url(#${halfClip})` }, parent);
    const zone = (key: keyof ZoneShares, d: string, into: SVGElement): void => {
      svgEl('path', { class: 'gfx-court__zone', 'fill-rule': 'evenodd', d, fill: `url(#${patternIds[key]})` }, into);
    };
    zone('lt8', circ(HOOP_X, HOOP_Y, 8), zones);
    zone('m8_16', circ(HOOP_X, HOOP_Y, 16) + circ(HOOP_X, HOOP_Y, 8), zones);
    zone('m16_24', circ(HOOP_X, HOOP_Y, 24) + circ(HOOP_X, HOOP_Y, 16), svgEl('g', { 'clip-path': `url(#${insideClip})` }, zones));
    zone('p24', 'M0,0H50V47H0Z' + INSIDE3, zones);
    for (const line of halfLines) addLine(parent, line);
  };
  buildHalf(svgEl('g', {}, g));
  if (view === 'full') buildHalf(svgEl('g', { transform: 'matrix(1 0 0 -1 0 94)' }, g));
  const shared = svgEl('g', {}, g);
  addLine(shared, { d: `M0,0H50V${length}H0Z`, from: 0, to: 0.3 });
  if (view === 'half') addLine(shared, { d: 'M19,47A6,6 0 0 1 31,47', from: 0.7, to: 1 });
  else {
    addLine(shared, { d: 'M0,47H50', from: 0.6, to: 0.8 });
    addLine(shared, { d: circ(25, 47, 6), from: 0.7, to: 1 });
  }
  const shotG = svgEl('g', { display: 'none' }, g);
  const shotPath = svgEl('path', { class: 'gfx-court__shot', d: '' }, shotG);
  const ball = svgEl('circle', { class: 'gfx-court__ball', r: BALL_R, fill: `url(#${ballPatternId})` }, shotG);

  // 2px strokes regardless of rendered size: stroke width in feet = px / (px per ft).
  let sw = 0.2;
  const fit = (): void => {
    const px = el.clientWidth || 600;
    sw = (STROKE_PX * W) / px;
    svg.style.setProperty('--sw', sw.toFixed(4));
    shotPath.setAttribute('stroke-dasharray', `${(sw * 3).toFixed(3)} ${(sw * 2.2).toFixed(3)}`);
  };
  fit();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  ro?.observe(el);

  const apply = (p: number): void => {
    for (const { el: path, from, to } of lineEls) {
      const local = clamp01((p - from) / (to - from));
      if (local >= 1) { path.removeAttribute('stroke-dasharray'); path.removeAttribute('stroke-dashoffset'); }
      else { path.setAttribute('stroke-dasharray', '1'); path.setAttribute('stroke-dashoffset', String(1 - local)); }
    }
  };
  const player = createPlayer(apply, opts.duration ?? 1200);
  player.set(0);

  const radii: Record<keyof ZoneShares, number> = { lt8: 0, m8_16: 0, m16_24: 0, p24: 0 };
  let cancelZones = (): void => {};
  const zones = (values: ZoneShares): void => {
    cancelZones();
    const start = { ...radii };
    const target = {} as Record<keyof ZoneShares, number>;
    for (const key of ZONE_KEYS) {
      const share = Math.max(0, values[key]);
      target[key] = share <= 0 ? 0 : Math.max(0.1, Math.min(DOT_MAX, (share / 45) * DOT_MAX));
    }
    cancelZones = tween(400, (u) => {
      for (const key of ZONE_KEYS) {
        radii[key] = start[key] + (target[key] - start[key]) * u;
        dots[key].setAttribute('r', radii[key].toFixed(3));
      }
    });
  };

  const shot = (from: CourtPoint, apex: number, t: number): void => {
    const far = view === 'full' && from.y > 47;
    const hoop = { x: HOOP_X, y: far ? 94 - HOOP_Y : HOOP_Y };
    // "Up" on screen in feet space: +y for the half view, -x for the landscape full view.
    const up = view === 'half' ? { x: 0, y: 1 } : { x: -1, y: 0 };
    const c = { x: (from.x + hoop.x) / 2 + up.x * apex * 2, y: (from.y + hoop.y) / 2 + up.y * apex * 2 };
    const at = (u: number): CourtPoint => ({
      x: (1 - u) ** 2 * from.x + 2 * (1 - u) * u * c.x + u * u * hoop.x,
      y: (1 - u) ** 2 * from.y + 2 * (1 - u) * u * c.y + u * u * hoop.y,
    });
    const tt = clamp01(t);
    const n = Math.max(1, Math.ceil(tt * 48));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const q = at((i / n) * tt);
      d += `${i ? 'L' : 'M'}${q.x.toFixed(3)},${q.y.toFixed(3)}`;
    }
    shotPath.setAttribute('d', d);
    const b = at(tt);
    ball.setAttribute('cx', b.x.toFixed(3));
    ball.setAttribute('cy', b.y.toFixed(3));
    shotG.removeAttribute('display');
  };
  const clearShot = (): void => { shotG.setAttribute('display', 'none'); };

  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: player.set,
    zones,
    shot,
    clearShot,
    hoopEl: () => hoop!,
    hoopRect: () => hoop!.getBoundingClientRect(),
    destroy: () => { player.destroy(); cancelZones(); ro?.disconnect(); el.remove(); },
  };
}
