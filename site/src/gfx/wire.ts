/**
 * createWire: a slowly rotating electric-blue 3D wireframe (torus, sphere, cylinder or plane) drawn
 * as SVG polylines through a tiny perspective projection. play() loops one revolution per 20 s
 * (static under reduced motion), pause() stops, set(t) sets the rotation (t = turns).
 */
import './gfx.css';
import { createPlayer, svgEl, type GfxHandle } from './motion';

export type WireShape = 'torus' | 'sphere' | 'cylinder' | 'plane';
export interface WireOpts {
  shape: WireShape;
  /** Milliseconds per revolution (default 20000). */
  period?: number;
  /** Fixed tilt around the x axis in radians (default 0.5; the plane uses 1.05). */
  tilt?: number;
}
export type WireHandle = GfxHandle;

type V3 = [number, number, number];
const SCALE = 100, FOCAL = 2.6, DIST = 4.2;

function lines(shape: WireShape): V3[][] {
  const out: V3[][] = [];
  const ring = (f: (u: number) => V3, n = 48): V3[] => Array.from({ length: n + 1 }, (_, i) => f((i / n) * Math.PI * 2));
  if (shape === 'torus') {
    const R = 1, r = 0.42;
    for (let j = 0; j < 24; j++) {
      const v = (j / 24) * Math.PI * 2;
      out.push(ring((u) => [(R + r * Math.cos(u)) * Math.cos(v), r * Math.sin(u), (R + r * Math.cos(u)) * Math.sin(v)], 24));
    }
    for (let j = 0; j < 12; j++) {
      const u = (j / 12) * Math.PI * 2;
      out.push(ring((v) => [(R + r * Math.cos(u)) * Math.cos(v), r * Math.sin(u), (R + r * Math.cos(u)) * Math.sin(v)], 64));
    }
  } else if (shape === 'sphere') {
    const r = 1.15;
    for (let j = 1; j < 10; j++) {
      const lat = (j / 10) * Math.PI - Math.PI / 2;
      out.push(ring((u) => [r * Math.cos(lat) * Math.cos(u), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(u)], 48));
    }
    for (let j = 0; j < 12; j++) {
      const lon = (j / 12) * Math.PI;
      out.push(ring((u) => [r * Math.cos(u) * Math.cos(lon), r * Math.sin(u), r * Math.cos(u) * Math.sin(lon)], 48));
    }
  } else if (shape === 'cylinder') {
    const r = 0.85, h = 1.5;
    for (let j = 0; j <= 4; j++) {
      const y = -h / 2 + (j / 4) * h;
      out.push(ring((u) => [r * Math.cos(u), y, r * Math.sin(u)], 48));
    }
    for (let j = 0; j < 16; j++) {
      const u = (j / 16) * Math.PI * 2;
      out.push([[r * Math.cos(u), -h / 2, r * Math.sin(u)], [r * Math.cos(u), h / 2, r * Math.sin(u)]]);
    }
  } else {
    const s = 1.3, n = 8;
    for (let j = 0; j <= n; j++) {
      const a = -s + (j / n) * 2 * s;
      out.push([[-s, 0, a], [s, 0, a]]);
      out.push([[a, 0, -s], [a, 0, s]]);
    }
  }
  return out;
}

export function createWire(container: HTMLElement, opts: WireOpts): WireHandle {
  const tilt = opts.tilt ?? (opts.shape === 'plane' ? 1.05 : 0.5);
  const el = document.createElement('div');
  el.className = 'gfx gfx-wire';
  el.setAttribute('aria-hidden', 'true');
  const svg = svgEl('svg', { viewBox: '-150 -150 300 300' }, el);
  const model = lines(opts.shape);
  const polys = model.map(() => svgEl('polyline', { class: 'gfx-wire__line' }, svg));
  const ct = Math.cos(tilt), st = Math.sin(tilt);

  const apply = (t: number): void => {
    const a = t * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    model.forEach((pts, i) => {
      let s = '';
      for (const [x0, y0, z0] of pts) {
        // rotate around y, then tilt around x, then perspective
        const x1 = x0 * ca + z0 * sa, z1 = -x0 * sa + z0 * ca;
        const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
        const k = (FOCAL / (z2 + DIST)) * SCALE;
        s += `${(x1 * k).toFixed(1)},${(-y2 * k).toFixed(1)} `;
      }
      polys[i].setAttribute('points', s);
    });
  };
  const player = createPlayer(apply, opts.period ?? 20000, { loop: true });
  player.set(0.08);
  container.appendChild(el);
  return { el, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); el.remove(); } };
}
