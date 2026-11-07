/**
 * createCounter: a big display-type number that counts from `from` to `to`.
 * set(t) is linear in t; play() applies the ease-out curve over `duration` ms.
 */
import './gfx.css';
import { createPlayer, htmlEl, lerp, type GfxHandle } from './motion';

export interface CounterOpts {
  from?: number;
  to?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  /** play() duration in ms (default 1200). */
  duration?: number;
  /** Vox style: put the number inside a yellow disc with ink text. */
  disc?: boolean;
}
export interface CounterHandle extends GfxHandle { readonly value: number }

export function createCounter(container: HTMLElement, opts: CounterOpts = {}): CounterHandle {
  const from = opts.from ?? 0, to = opts.to ?? 100, decimals = opts.decimals ?? 0;
  const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const el = htmlEl('span', `gfx gfx-counter${opts.disc ? ' gfx-counter--disc' : ''}`);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `${opts.prefix ?? ''}${fmt.format(to)}${opts.suffix ?? ''}`);
  if (opts.prefix) htmlEl('span', 'gfx-counter__prefix', el, opts.prefix);
  const value = htmlEl('span', 'gfx-counter__value', el);
  if (opts.suffix) htmlEl('span', 'gfx-counter__suffix', el, opts.suffix);
  let current = from;
  const player = createPlayer((p) => {
    current = lerp(from, to, p);
    value.textContent = fmt.format(current);
  }, opts.duration ?? 1200);
  player.set(0);
  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: player.set,
    get value() { return current; },
    destroy: () => { player.destroy(); el.remove(); },
  };
}
