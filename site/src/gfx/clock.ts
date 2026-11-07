/**
 * createClock: a game clock ("4:39") in display type inside a thin ring that drains (yellow on the
 * olive ground, blue on paper). set(t): the ring drains from full (t=0) to empty (t=1) while the
 * numerals run from `from` to `to` seconds. Defaults: 4:39 down to 0:00 (the scoreless stretch).
 */
import './gfx.css';
import { createPlayer, lerp, svgEl, type GfxHandle } from './motion';
import { formatClock } from './scoreboard';

export interface ClockOpts {
  /** Seconds on the clock at t=0 (default 279 = 4:39). */
  from?: number;
  /** Seconds at t=1 (default 0). */
  to?: number;
  /** play() duration in ms (default 2400). */
  duration?: number;
}
export interface ClockHandle extends GfxHandle { readonly seconds: number }

const R = 90, C = 2 * Math.PI * R;

export function createClock(container: HTMLElement, opts: ClockOpts = {}): ClockHandle {
  const from = opts.from ?? 279, to = opts.to ?? 0;
  const el = document.createElement('div');
  el.className = 'gfx gfx-clock';
  const svg = svgEl('svg', { viewBox: '0 0 200 200', role: 'img' }, el);
  svgEl('circle', { class: 'gfx-clock__track', cx: 100, cy: 100, r: R }, svg);
  const ring = svgEl('circle', {
    class: 'gfx-clock__ring', cx: 100, cy: 100, r: R, transform: 'rotate(-90 100 100)',
    'stroke-dasharray': `${C.toFixed(2)} ${C.toFixed(2)}`, 'stroke-dashoffset': 0,
  }, svg);
  const text = svgEl('text', { class: 'gfx-clock__text', x: 100, y: 100, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, svg);
  let seconds = from;
  const player = createPlayer((p) => {
    seconds = lerp(from, to, p);
    ring.setAttribute('stroke-dashoffset', (C * p).toFixed(2));
    text.textContent = formatClock(seconds);
    svg.setAttribute('aria-label', `${formatClock(seconds)} on the game clock`);
  }, opts.duration ?? 2400);
  player.set(0);
  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: player.set,
    get seconds() { return seconds; },
    destroy: () => { player.destroy(); el.remove(); },
  };
}
