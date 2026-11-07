/**
 * createConfetti: lightweight canvas confetti of yellow / chalk / electric-blue squares falling.
 * The frame is a pure function of time, so set(t) renders a deterministic frame (one loop = `loop` ms)
 * and play() cycles it. Reduced motion renders a static scatter.
 * The root is position:absolute inset 0, so give the container a size and position:relative.
 */
import './gfx.css';
import { createPlayer, seeded, type GfxHandle } from './motion';

export interface ConfettiOpts {
  /** Number of pieces (default 140). */
  count?: number;
  /** Loop length in ms (default 6000). */
  loop?: number;
  seed?: number;
}
export type ConfettiHandle = GfxHandle;

interface Piece { x: number; y: number; vy: number; sway: number; freq: number; phase: number; rot: number; vr: number; w: number; h: number; c: number }

export function createConfetti(container: HTMLElement, opts: ConfettiOpts = {}): ConfettiHandle {
  const count = opts.count ?? 140;
  const loop = opts.loop ?? 6000;
  const rnd = seeded(opts.seed ?? 11);
  const el = document.createElement('div');
  el.className = 'gfx gfx-confetti';
  el.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const size = 6 + rnd() * 7;
    pieces.push({
      x: rnd(), y: rnd(), vy: 0.12 + rnd() * 0.16, sway: 0.01 + rnd() * 0.03, freq: 1 + rnd() * 2,
      phase: rnd() * Math.PI * 2, rot: rnd() * Math.PI, vr: (rnd() - 0.5) * 6, w: 0, h: 0, c: i % 3,
    });
    pieces[i].w = size; pieces[i].h = size;
  }

  let colors = ['#f2de4a', '#f5f1ec', '#2b3bff'];
  const readColors = (): void => {
    const cs = getComputedStyle(el);
    const pick = (name: string, fallback: string): string => cs.getPropertyValue(name).trim() || fallback;
    colors = [pick('--sun', colors[0]), pick('--chalk', colors[1]), pick('--blue', colors[2])];
  };
  let W = 0, H = 0, dpr = 1;
  const fit = (): void => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = el.clientWidth || 600; H = el.clientHeight || 300;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    readColors();
  };
  fit();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { fit(); draw(lastT); }) : null;
  ro?.observe(el);

  let lastT = 0;
  const draw = (t: number): void => {
    lastT = t;
    if (!ctx) return;
    const T = t * (loop / 1000);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const span = H + 24;
    for (const p of pieces) {
      const y = (((p.y * span + p.vy * T * H) % span) + span) % span - 16;
      const x = (p.x + p.sway * Math.sin(T * p.freq + p.phase)) * W;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot + p.vr * T);
      ctx.fillStyle = colors[p.c];
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  };
  const player = createPlayer(draw, loop, { loop: true });
  player.set(0.35);

  container.appendChild(el);
  // Fonts/tokens may resolve after mount; re-read colors once laid out.
  requestAnimationFrame(() => { fit(); draw(lastT); });
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: player.set,
    destroy: () => { player.destroy(); ro?.disconnect(); el.remove(); },
  };
}
