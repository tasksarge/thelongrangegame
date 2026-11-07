/**
 * Halftone texture pieces.
 * - createDotField(el, { from, to, direction }): an SVG dot field filling the container (position:absolute
 *   inset 0) whose dot radius fades from `from` to `to` (0..9) across the box, fill currentColor.
 *   set(t) reveals it along the direction with clip-path.
 * - createChecker(el, { cells, rows }): a checkerboard strip in blue / transparent; set(t) reveals left to right.
 */
import './gfx.css';
import { createPlayer, lerp, observeSize, svgEl, type GfxHandle } from './motion';

export type DotDirection = 'ltr' | 'rtl' | 'ttb';
export interface DotFieldOpts {
  /** Dot size at the start edge, 0..9 (default 8). */
  from?: number;
  /** Dot size at the far edge, 0..9 (default 1). */
  to?: number;
  direction?: DotDirection;
  /** Grid cell in px (default 12). */
  cell?: number;
  duration?: number;
}
export interface CheckerOpts { cells?: number; rows?: number; duration?: number }

export function createDotField(container: HTMLElement, opts: DotFieldOpts = {}): GfxHandle {
  const from = Math.max(0, Math.min(9, opts.from ?? 8)), to = Math.max(0, Math.min(9, opts.to ?? 1));
  const dir = opts.direction ?? 'ltr', cell = opts.cell ?? 12;
  const el = document.createElement('div');
  el.className = 'gfx gfx-dots';
  el.setAttribute('aria-hidden', 'true');
  const svg = svgEl('svg', {}, el);
  const stop = observeSize(el, (W, H) => {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    const maxR = cell * 0.48;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const u = dir === 'ttb' ? j / Math.max(1, rows - 1) : i / Math.max(1, cols - 1);
        const v = dir === 'rtl' ? 1 - u : u;
        const r = (lerp(from, to, v) / 9) * maxR;
        if (r < 0.3) continue;
        svgEl('circle', { class: 'gfx-dots__dot', cx: (i + 0.5) * cell, cy: (j + 0.5) * cell, r: r.toFixed(2) }, svg);
      }
    }
  });
  const player = createPlayer((p) => {
    const hide = ((1 - p) * 100).toFixed(2);
    svg.style.clipPath = p >= 1 ? '' : dir === 'ttb' ? `inset(0 0 ${hide}% 0)` : dir === 'rtl' ? `inset(0 0 0 ${hide}%)` : `inset(0 ${hide}% 0 0)`;
  }, opts.duration ?? 900);
  player.set(0);
  container.appendChild(el);
  return { el, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); stop(); el.remove(); } };
}

export function createChecker(container: HTMLElement, opts: CheckerOpts = {}): GfxHandle {
  const cells = Math.max(1, Math.floor(opts.cells ?? 12)), rows = Math.max(1, Math.floor(opts.rows ?? 2));
  const el = document.createElement('div');
  el.className = 'gfx gfx-checker';
  el.setAttribute('aria-hidden', 'true');
  const svg = svgEl('svg', { viewBox: `0 0 ${cells} ${rows}`, preserveAspectRatio: 'none' }, el);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cells; i++) if ((i + j) % 2 === 0) svgEl('rect', { class: 'gfx-checker__cell', x: i, y: j, width: 1, height: 1 }, svg);
  const player = createPlayer((p) => {
    svg.style.clipPath = p >= 1 ? '' : `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
  }, opts.duration ?? 600);
  player.set(0);
  container.appendChild(el);
  return { el, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); el.remove(); } };
}
