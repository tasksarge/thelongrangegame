/**
 * Shared motion helpers for the code-drawn graphics.
 * - cubicBezier(): a small solver so play() can use the design-system curve
 *   cubic-bezier(0.23, 1, 0.32, 1) from requestAnimationFrame.
 * - createPlayer(): drives a deterministic `apply(progress)` from 0..1 over time.
 * Every module's `set(progress)` is a pure function of progress, so scroll or
 * taps can drive it; `play()` only moves progress through time with the curve.
 */

export type Easing = (t: number) => number;

/** Common handle returned by every factory in src/gfx. */
export interface GfxHandle {
  /** Root element the factory appended to the container. */
  el: HTMLElement;
  /** Animate from the current progress to 1 (replays from 0 when already at 1). Reduced motion jumps to 1. */
  play(): void;
  /** Stop the running animation and keep the current progress. */
  pause(): void;
  /** Deterministically render progress 0..1. */
  set(progress: number): void;
  /** Remove DOM, observers and timers. */
  destroy(): void;
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of linear time 0..1. Newton with a bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    while (hi - lo > 1e-6) {
      t = (lo + hi) / 2;
      if (sampleX(t) < x) lo = t; else hi = t;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solve(x)));
}

/** Enters/exits and explanatory motion (DESIGN.md). */
export const easeOut: Easing = cubicBezier(0.23, 1, 0.32, 1);
/** On-screen moves (DESIGN.md). */
export const easeInOut: Easing = cubicBezier(0.77, 0, 0.175, 1);

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface PlayerOpts {
  /** Keep cycling 0..1 (confetti). Reduced motion renders one static frame instead. */
  loop?: boolean;
  /** Easing for play(); the default is the design-system ease-out. Loops are always linear. */
  ease?: Easing;
}

export interface Player {
  play(): void;
  pause(): void;
  set(progress: number): void;
  readonly progress: number;
  readonly playing: boolean;
  destroy(): void;
}

/** Drives `apply(progress)` with requestAnimationFrame over `duration` ms. */
export function createPlayer(apply: (progress: number) => void, duration: number, opts: PlayerOpts = {}): Player {
  let progress = 0;
  let raf = 0;
  const ease = opts.ease ?? easeOut;
  const stop = (): void => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const set = (p: number): void => { progress = clamp01(p); apply(progress); };
  const play = (): void => {
    stop();
    if (prefersReducedMotion()) { set(opts.loop ? 0.5 : 1); return; }
    const p0 = !opts.loop && progress >= 1 ? 0 : progress;
    const start = performance.now();
    if (opts.loop) {
      const tick = (now: number): void => {
        set((p0 + (now - start) / duration) % 1);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return;
    }
    const total = duration * (1 - p0);
    const tick = (now: number): void => {
      const u = total <= 0 ? 1 : clamp01((now - start) / total);
      set(p0 + (1 - p0) * ease(u));
      raf = u < 1 ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
  };
  return {
    play,
    pause: stop,
    set,
    get progress() { return progress; },
    get playing() { return raf !== 0; },
    destroy: stop,
  };
}

/** Deterministic PRNG (mulberry32) so jittered drawings are stable across set() calls. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Tiny SVG element helper: tag, attributes, optional parent. */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

/** Plain HTML element helper. */
export function htmlEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: Element,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  parent?.appendChild(node);
  return node;
}

/** True when the container sits on the ink ground (a `.scene--dark` or `[data-ground="ink"]` ancestor). */
export function onInkGround(el: Element): boolean {
  return el.closest('.scene--dark, [data-ground="ink"]') !== null;
}

let uid = 0;
/** Unique id for SVG defs (clipPath, mask) so several instances can share a page. */
export const nextId = (prefix: string): string => `${prefix}-${++uid}`;

/** One-shot tween of 0..1 over `duration` ms with the ease-out curve; returns a cancel function. Reduced motion applies 1 at once. */
export function tween(duration: number, apply: (u: number) => void, ease: Easing = easeOut): () => void {
  if (prefersReducedMotion() || duration <= 0) { apply(1); return () => {}; }
  const start = performance.now();
  let raf = 0;
  const tick = (now: number): void => {
    const u = clamp01((now - start) / duration);
    apply(ease(u));
    raf = u < 1 ? requestAnimationFrame(tick) : 0;
  };
  raf = requestAnimationFrame(tick);
  return () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
}

/** Observe a box and call `fit(width, height)` now and on every resize. Returns a disconnect function. */
export function observeSize(el: HTMLElement, fit: (w: number, h: number) => void, fallback = { w: 600, h: 320 }): () => void {
  const run = (): void => fit(el.clientWidth || fallback.w, el.clientHeight || fallback.h);
  run();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(run) : null;
  ro?.observe(el);
  return () => ro?.disconnect();
}
