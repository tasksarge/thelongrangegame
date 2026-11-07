/**
 * Hand-made emphasis around existing text.
 * - createHighlight(span, { color }): a rough marker stroke behind the words (SVG, position:absolute,
 *   z-index -1, sized to the glyphs' ink box, re-measured on resize). set(t) reveals it left to right via clip-path.
 * - createCircle(el, { color }): a rough hand-drawn ellipse (two overlapping loops, 3px) around the element;
 *   set(t) drives stroke-dashoffset.
 * Unlike the other factories, `el` here is the element being decorated; the returned `el` is the SVG.
 * Vertical placement uses canvas text metrics, because display fonts carry tall ascender/descender
 * metrics and the marker should hug the letters, not the line box.
 */
import './gfx.css';
import { createPlayer, seeded, svgEl, type GfxHandle } from './motion';

export interface HighlightOpts { color?: 'sun' | 'blue'; seed?: number; duration?: number }
export interface CircleOpts { color?: 'sun' | 'blue' | 'chalk' | 'ink'; seed?: number; duration?: number }
export interface DecorHandle extends Omit<GfxHandle, 'el'> { el: SVGSVGElement }

/** Ink box of an element's text relative to its own border box: { top, height } in px. */
function inkBox(el: HTMLElement): { top: number; height: number } {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize) || 16;
  const fallback = { top: size * 0.12, height: size * 0.74 };
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    let text = el.textContent?.trim() || 'Hg';
    if (cs.textTransform === 'uppercase') text = text.toUpperCase();
    const m = ctx.measureText(text);
    if (typeof m.fontBoundingBoxAscent !== 'number') return fallback;
    const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
    const content = A + D;
    // Inline boxes are exactly the content area; blocks place it with half-leading inside the line height.
    const L = cs.display === 'inline' ? content : (cs.lineHeight === 'normal' ? content : parseFloat(cs.lineHeight) || content);
    const top = (L - content) / 2 + (A - m.actualBoundingBoxAscent);
    return { top, height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
  } catch {
    return fallback;
  }
}

/**
 * Inline targets get no ResizeObserver notifications, so re-measure on font load, window resize and
 * whenever the parent block resizes. Returns a disconnect function.
 */
function observeInline(target: HTMLElement, fit: () => void): () => void {
  fit();
  const onResize = (): void => fit();
  window.addEventListener('resize', onResize);
  document.fonts?.ready.then(fit).catch(() => {});
  const parent = target.parentElement;
  const ro = parent && typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  if (parent) ro?.observe(parent);
  return () => { window.removeEventListener('resize', onResize); ro?.disconnect(); };
}

/** Place the decoration svg over the target's ink box with horizontal/vertical padding in px. */
function place(svg: SVGSVGElement, target: HTMLElement, padX: number, padY: number): { W: number; H: number } {
  const ink = inkBox(target);
  const rect = target.getBoundingClientRect();
  const W = Math.max(1, rect.width + 2 * padX), H = Math.max(1, ink.height + 2 * padY);
  svg.style.left = `${(-padX).toFixed(1)}px`;
  svg.style.right = 'auto';
  svg.style.width = `${W.toFixed(1)}px`;
  svg.style.top = `${(ink.top - padY).toFixed(1)}px`;
  svg.style.bottom = 'auto';
  svg.style.height = `${H.toFixed(1)}px`;
  svg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
  return { W, H };
}

/** Rough marker rectangle: wobbly edges, slightly tapered right end, soft corners. */
function markerPath(W: number, H: number, rnd: () => number): string {
  const pts: [number, number][] = [];
  const n = 14, wob = Math.min(3, H * 0.06);
  const j = (): number => (rnd() - 0.5) * 2 * wob;
  for (let i = 0; i <= n; i++) pts.push([(i / n) * W + j(), j() + (i / n) * H * 0.05]);
  for (let i = 1; i < 3; i++) pts.push([W + j() - (i === 1 ? 0 : H * 0.08), (i / 3) * H + j()]);
  for (let i = n; i >= 0; i--) pts.push([(i / n) * W + j(), H + j() - (1 - i / n) * H * 0.05]);
  for (let i = 2; i >= 1; i--) pts.push([j() + (i === 1 ? -H * 0.05 : 0), (i / 3) * H + j()]);
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('') + 'Z';
}

export function createHighlight(target: HTMLElement, opts: HighlightOpts = {}): DecorHandle {
  const color = opts.color ?? 'sun';
  target.classList.add('gfx-highlight-host');
  const svg = svgEl('svg', { class: 'gfx gfx-highlight', 'aria-hidden': 'true', preserveAspectRatio: 'none' }, target);
  const mark = svgEl('path', { class: 'gfx-highlight__mark', 'data-color': color }, svg);
  const stop = observeInline(target, () => {
    const size = parseFloat(getComputedStyle(target).fontSize) || 16;
    const { W, H } = place(svg, target, size * 0.2, inkBox(target).height * 0.14);
    mark.setAttribute('d', markerPath(W, H, seeded(opts.seed ?? 17)));
  });
  const player = createPlayer((p) => {
    svg.style.clipPath = p >= 1 ? '' : `inset(-10% ${((1 - p) * 100).toFixed(2)}% -10% -10%)`;
  }, opts.duration ?? 700);
  player.set(0);
  return { el: svg, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); stop(); svg.remove(); target.classList.remove('gfx-highlight-host'); } };
}

export function createCircle(target: HTMLElement, opts: CircleOpts = {}): DecorHandle {
  const color = opts.color ?? 'sun';
  target.classList.add('gfx-highlight-host');
  const svg = svgEl('svg', { class: 'gfx gfx-circle', 'aria-hidden': 'true', preserveAspectRatio: 'none' }, target);
  const path = svgEl('path', { class: 'gfx-circle__path', 'data-color': color, pathLength: 1 }, svg);
  const stop = observeInline(target, () => {
    const { W, H } = place(svg, target, target.getBoundingClientRect().width * 0.16, inkBox(target).height * 0.36);
    const rnd = seeded(opts.seed ?? 23);
    const cx = W / 2, cy = H / 2, rx = W * 0.46, ry = H * 0.44;
    const pts: string[] = [];
    const n = 72;
    for (let i = 0; i <= n * 2; i++) {
      const a = -0.6 + (i / n) * Math.PI * 2;
      const loop = i > n ? 1 : 0;
      const w = 1 + (rnd() - 0.5) * 0.05 + loop * 0.045 * Math.sin(a * 1.5);
      const x = cx + Math.cos(a) * rx * w + (rnd() - 0.5) * 2;
      const y = cy + Math.sin(a) * ry * w * (1 + loop * 0.06) + (rnd() - 0.5) * 2;
      pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    path.setAttribute('d', pts.join(''));
  });
  const player = createPlayer((p) => {
    if (p >= 1) { path.removeAttribute('stroke-dasharray'); path.removeAttribute('stroke-dashoffset'); }
    else { path.setAttribute('stroke-dasharray', '1'); path.setAttribute('stroke-dashoffset', String(1 - p)); }
  }, opts.duration ?? 900);
  player.set(0);
  return { el: svg, play: player.play, pause: player.pause, set: player.set, destroy: () => { player.destroy(); stop(); svg.remove(); target.classList.remove('gfx-highlight-host'); } };
}
