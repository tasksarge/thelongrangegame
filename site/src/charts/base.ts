/**
 * Shared chart chrome: title/subtitle/note above, SVG body, source line + Data panel below.
 * Responsive via ResizeObserver; every color and font comes from the CSS tokens.
 */
import * as d3 from 'd3';
import type { DataSource } from './types';
import './charts.css';

export type Sel<T extends Element> = d3.Selection<T, unknown, null, undefined>;
export type G = Sel<SVGGElement>;
export type Linear = d3.ScaleLinear<number, number>;

let uid = 0;
export const nextId = (prefix: string): string => `${prefix}-${++uid}`;

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Every number that reaches a title, label or alt text goes through one of these: never a literal NaN. */
const guard = (f: (v: number) => string) => (v: number | undefined | null): string => (typeof v === 'number' && Number.isFinite(v) ? f(v) : '—');
export const fmt1 = guard(d3.format('.1f'));
export const fmt2 = guard(d3.format('.2f'));
export const fmtInt = guard(d3.format(',d'));
export const fmtPct1 = (v: number | undefined | null): string => (typeof v === 'number' && Number.isFinite(v) ? `${fmt1(v)}%` : '—');
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** True when `year` lies inside the plotted x range, so a reference line can be drawn for it. */
export const inRange = (year: number, years: number[]): boolean => years.length > 0 && year >= years[0] && year <= years[years.length - 1];
/** 1998 -> ’98 */
export const yy = (endYear: number): string => `’${String(endYear % 100).padStart(2, '0')}`;
export const isoDate = (iso: string): string => (iso || '').slice(0, 10);
export const hostOf = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};
export const clamp01 = (t: number): number => Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));

/** Container width -> height/width ratio. Capped so a chart card fits a 1280×800 viewport: 0.6 wide, 1.0 under 560px. */
export const aspect = (w: number): number => (w < 560 ? 1 : 0.6);

export interface Margin { top: number; right: number; bottom: number; left: number }
export const MARGIN: Margin = { top: 44, right: 76, bottom: 44, left: 56 };
export const marginFor = (w: number, base: Margin = MARGIN): Margin =>
  w < 560 ? { top: base.top, right: Math.min(base.right, 44), bottom: base.bottom, left: Math.min(base.left, 44) } : base;

export interface FrameSpec {
  num: string;
  title: string;
  subtitle: string;
  note?: string;
}

/** Reads a token at render time (needed where SVG/CSS cannot interpolate, e.g. color ramps). */
export const cssVar = (el: Element, name: string): string => getComputedStyle(el).getPropertyValue(name).trim();

export class Frame {
  readonly root: HTMLElement;
  readonly head: HTMLElement;
  readonly subEl: HTMLElement;
  readonly titleEl: HTMLElement;
  readonly numEl: HTMLElement;
  readonly titleText: HTMLElement;
  readonly noteEl: HTMLElement;
  readonly body: HTMLElement;
  readonly foot: HTMLElement;
  readonly sourceEl: HTMLElement;
  readonly dataBtn: HTMLButtonElement;
  readonly panel: HTMLElement;
  private svgEl: SVGSVGElement | null = null;
  private ro: ResizeObserver | null = null;
  private lastW = -1;

  /**
   * Renders into `container` itself (the shell passes an element that already has class "chart").
   * Chrome classes (chart-title, chart-sub, chart-source, chart-data, chart-rows) are styled in
   * src/styles/base.css; charts.css only styles what the SVG and chart-specific parts need.
   */
  constructor(container: HTMLElement, cls: string) {
    this.root = container;
    this.root.classList.add('chart', cls);

    this.head = document.createElement('div');
    this.head.className = 'chart-head';
    this.titleEl = document.createElement('h3');
    this.titleEl.className = 'chart-title';
    this.numEl = document.createElement('span');
    this.numEl.className = 'chart-num';
    this.titleText = document.createElement('span');
    this.titleEl.append(this.numEl, this.titleText);
    this.subEl = document.createElement('p');
    this.subEl.className = 'chart-sub';
    this.noteEl = document.createElement('p');
    this.noteEl.className = 'chart-note';
    this.noteEl.hidden = true;
    this.head.append(this.titleEl, this.subEl, this.noteEl);

    this.body = document.createElement('div');
    this.body.className = 'chart-body';

    this.foot = document.createElement('div');
    this.foot.className = 'chart-foot';
    this.sourceEl = document.createElement('p');
    this.sourceEl.className = 'chart-source';
    this.dataBtn = document.createElement('button');
    this.dataBtn.type = 'button';
    this.dataBtn.className = 'chart-data';
    this.dataBtn.textContent = 'Data';
    this.dataBtn.setAttribute('aria-expanded', 'false');
    this.panel = document.createElement('div');
    this.panel.className = 'chart-rows';
    this.panel.id = nextId('chart-rows');
    this.panel.hidden = true;
    this.dataBtn.setAttribute('aria-controls', this.panel.id);
    this.dataBtn.addEventListener('click', () => {
      const open = this.panel.hidden;
      this.panel.hidden = !open;
      this.dataBtn.setAttribute('aria-expanded', String(open));
    });
    this.foot.append(this.sourceEl, this.panel);

    this.root.append(this.head, this.body, this.foot);
  }

  setSpec(spec: FrameSpec): void {
    this.numEl.textContent = spec.num;
    this.titleText.textContent = spec.title;
    this.subEl.textContent = spec.subtitle;
    this.noteEl.textContent = spec.note ?? '';
    this.noteEl.hidden = !spec.note;
  }

  /** Source line + the Data table. `rows` are exactly the rows plotted. */
  setSource(src: DataSource, columns?: string[]): void {
    this.sourceEl.replaceChildren();
    const text = document.createElement('span');
    text.append(`${src.file} · pulled ${isoDate(src.pulledAt)} · `);
    const a = document.createElement('a');
    a.href = src.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = hostOf(src.url);
    text.appendChild(a);
    this.sourceEl.append(text, this.dataBtn);

    const cols = columns ?? (src.rows[0] ? Object.keys(src.rows[0]) : []);
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    for (const c of cols) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = c;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    const tbody = document.createElement('tbody');
    for (const r of src.rows) {
      const tr = document.createElement('tr');
      for (const c of cols) {
        const td = document.createElement('td');
        const v = r[c];
        td.textContent = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : fmt2(v)) : String(v ?? '');
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.append(thead, tbody);
    this.panel.replaceChildren(table);
  }

  /** (Re)creates an empty SVG of the given logical size and returns its selection. */
  svg(W: number, H: number, alt: string): Sel<SVGSVGElement> {
    if (!this.svgEl) {
      this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgEl.setAttribute('class', 'chart-svg');
      this.svgEl.setAttribute('role', 'img');
      this.body.appendChild(this.svgEl);
    }
    const s = d3.select(this.svgEl);
    s.attr('viewBox', `0 0 ${W} ${H}`).attr('aria-label', alt);
    s.selectAll('*').remove();
    return s;
  }

  width(): number {
    return this.body.clientWidth || this.root.clientWidth || 0;
  }

  /** Calls fn whenever the body width changes (and once the body first gets a width). */
  observe(fn: () => void): void {
    if (this.ro) this.ro.disconnect();
    if (typeof ResizeObserver === 'undefined') return;
    let pending = 0;
    this.ro = new ResizeObserver(() => {
      const w = this.width();
      if (w > 0 && w !== this.lastW) {
        this.lastW = w;
        // Redraw on the next frame: drawing inside the callback changes the body's height and
        // trips "ResizeObserver loop completed with undelivered notifications".
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(fn);
      }
    });
    this.ro.observe(this.body);
  }

  destroy(): void {
    this.ro?.disconnect();
    this.head.remove();
    this.body.remove();
    this.foot.remove();
  }
}

/* ---------- SVG helpers ---------- */

/** Picks year ticks so that labels keep ≥ minGap px between them; always includes first and last. */
export function yearTicks(years: number[], w: number, minGap = 44): number[] {
  if (years.length === 0) return [];
  const first = years[0];
  const last = years[years.length - 1];
  const span = Math.max(1, last - first);
  const step = Math.max(1, Math.ceil(minGap / (w / span)));
  const out = years.filter((y) => (y - first) % step === 0);
  if (out[out.length - 1] !== last) {
    if ((last - out[out.length - 1]) * (w / span) < minGap * 0.7) out.pop();
    out.push(last);
  }
  return out;
}

export function drawYGrid(g: G, y: Linear, w: number, ticks: number[]): void {
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(ticks)
    .join('line')
    .attr('x1', 0)
    .attr('x2', w)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d));
}

/** Bottom axis: a 1px baseline plus year labels; no tick marks, no heavy domain line. */
export function drawXAxisYears(g: G, x: Linear, h: number, ticks: number[], w?: number): void {
  const ax = g
    .append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${h})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(ticks)
        .tickFormat((d) => yy(Number(d)))
        .tickSize(0)
        .tickPadding(10),
    );
  styleAxis(ax);
  const [x0, x1] = x.range();
  ax.append('line').attr('class', 'baseline').attr('x1', x0).attr('x2', w ?? x1).attr('y1', 0).attr('y2', 0);
}

/** Left axis: labels only, sitting on the grid lines. */
export function drawYAxis(g: G, y: Linear, ticks: number[], fmt: (v: number) => string = (v) => String(v)): void {
  const ax = g
    .append('g')
    .attr('class', 'axis axis-y')
    .call(
      d3
        .axisLeft(y)
        .tickValues(ticks)
        .tickFormat((d) => fmt(Number(d)))
        .tickSize(0)
        .tickPadding(10),
    );
  styleAxis(ax);
}

function styleAxis(ax: G): void {
  ax.attr('font-family', null).attr('font-size', null).attr('fill', null);
  ax.select('.domain').remove();
  ax.selectAll('.tick line').remove();
  ax.selectAll('.tick text').attr('class', 'axis-text').attr('fill', null);
}

/** d3.area from the series down to the baseline, in data space. */
export function areaPath(x: Linear, y: Linear, h: number): d3.Area<{ x: number; y: number }> {
  return d3
    .area<{ x: number; y: number }>()
    .x((d) => x(d.x))
    .y0(h)
    .y1((d) => y(d.y));
}

/** The paper's axis, widened (in `step` units) only if a real value falls outside it, so nothing clips. */
export function paperDomain(lo: number, hi: number, values: number[], step: number): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const a = min < lo ? Math.floor(min / step) * step : lo;
  const b = max > hi ? Math.ceil(max / step) * step : hi;
  return [a, b];
}

/** Y-axis title, rotated, placed just left of the tick labels. */
export function yAxisTitle(g: G, text: string, h: number, dx = -44): void {
  g.append('text')
    .attr('class', 'axis-title')
    .attr('transform', `translate(${dx},${h / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .text(text);
}

/** Two short slanted strokes at the bottom of the y axis: "this axis does not start at zero". */
export function axisBreak(g: G, h: number): void {
  const y0 = h - 10;
  g.append('path')
    .attr('class', 'axis-break')
    .attr('d', `M-5,${y0 + 4} l10,-6 M-5,${y0 + 9} l10,-6`);
  g.append('rect').attr('x', -2).attr('y', y0 - 1).attr('width', 4).attr('height', 8).attr('fill', 'var(--bg)');
  g.append('path')
    .attr('class', 'axis-break')
    .attr('d', `M-5,${y0 + 4} l10,-6 M-5,${y0 + 9} l10,-6`);
}

export interface SeriesOpts {
  /** Area path under the line (Now mode), filled with the halftone pattern `patternId`. */
  area?: string;
  patternId?: string;
  /** 'then' draws the paper's range in var(--steel); 'now' (default) in var(--accent). */
  variant?: 'then' | 'now';
}

/** Adds (once) the accent halftone pattern (2px dots on a 7px grid) and returns its id. */
export function halftonePattern(svg: Sel<SVGSVGElement>, id: string): string {
  let defs = svg.select<SVGDefsElement>('defs');
  if (defs.empty()) defs = svg.append('defs');
  if (defs.select(`#${id}`).empty()) {
    const p = defs.append('pattern').attr('id', id).attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7);
    p.append('circle').attr('class', 'halftone-dot').attr('cx', 3.5).attr('cy', 3.5).attr('r', 1);
  }
  return id;
}

/** Series line (3px, round caps) with an optional halftone area underneath. */
export function drawSeries(g: G, d: string, opts: SeriesOpts = {}): G {
  const wrap = g.append('g').attr('class', 'series-wrap');
  if (opts.area && opts.patternId) {
    wrap.append('path').attr('class', 'series-area').attr('d', opts.area).attr('fill', `url(#${opts.patternId})`);
  }
  wrap.append('path').attr('class', `series${opts.variant === 'then' ? ' series--then' : ''}`).attr('d', d);
  return wrap;
}

/** Poster "panel": a thin inner frame around the whole chart with a tiny mono caption top-left. */
export function panelFrame(svg: Sel<SVGSVGElement>, W: number, H: number, caption: string): void {
  svg.insert('rect', ':first-child').attr('class', 'panel-frame').attr('x', 0.75).attr('y', 0.75).attr('width', W - 1.5).attr('height', H - 1.5);
  svg.append('text').attr('class', 'panel-caption').attr('x', 10).attr('y', 16).text(caption);
}

/** Label-box metrics for callouts (Archivo 700 12px in a yellow box). */
const BOX_H = 22;
const boxWidth = (text: string): number => Math.round(text.length * 6.9 + 18);

function labelBox(g: G, bx: number, by: number, bw: number, text: string): void {
  g.append('rect').attr('class', 'callout-box').attr('x', bx).attr('y', by).attr('width', bw).attr('height', BOX_H).attr('rx', 4).attr('ry', 4);
  g.append('text').attr('class', 'callout-text').attr('x', bx + bw / 2).attr('y', by + BOX_H / 2 + 4).attr('text-anchor', 'middle').text(text);
}

export type CalloutPlace = 'left' | 'right' | 'above' | 'below';
export interface CalloutOpts {
  /** Plot width, for clamping the box inside the drawable area. */
  w: number;
  /** Plot height (needed for 'below'). */
  h?: number;
  /** Side of the point the box sits on. 'left' is collision-free for a series maximum. */
  place?: CalloutPlace;
  /** How far the box may overhang the plot on either side (the margins). */
  overhang?: number;
}

/** Hand-annotated callout: a slightly curved 2px leader with an open arrowhead at the point, ending in a yellow box. */
export function drawCallout(g: G, px: number, py: number, text: string, opts: CalloutOpts): void {
  const bw = boxWidth(text);
  const over = opts.overhang ?? 40;
  const lead = 26;
  const c = g.append('g').attr('class', 'callout');
  const fits: Record<CalloutPlace, boolean> = {
    left: px - lead - bw >= -over,
    right: px + lead + bw <= opts.w + over,
    above: py - lead - BOX_H >= -36,
    below: opts.h === undefined || py + lead + BOX_H <= opts.h + 8,
  };
  const order: CalloutPlace[] = [opts.place ?? 'left', 'left', 'right', 'below', 'above'];
  const place = order.find((p) => fits[p]) ?? 'above';

  // box position and the leader's end point (box side facing the point)
  let bx: number;
  let by: number;
  let ex: number;
  let ey: number;
  if (place === 'left' || place === 'right') {
    const dir = place === 'left' ? -1 : 1;
    bx = place === 'left' ? px - lead - bw : px + lead;
    by = py - BOX_H / 2;
    ex = place === 'left' ? bx + bw : bx;
    ey = py;
    void dir;
  } else {
    by = place === 'above' ? py - lead - BOX_H : py + lead;
    bx = Math.max(-over, Math.min(opts.w + over - bw, px - bw * 0.6));
    ex = Math.max(bx + 8, Math.min(bx + bw - 8, px - 10));
    ey = place === 'above' ? by + BOX_H : by;
  }
  // slightly curved leader: quadratic with the control point pushed off the straight line
  const sx = px + (ex - px) * 0.22;
  const sy = py + (ey - py) * 0.22;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(10, len * 0.18);
  const cx = mx - (dy / len) * bow;
  const cy = my + (dx / len) * bow;
  c.append('path').attr('class', 'callout-leader').attr('d', `M${ex},${ey} Q${cx},${cy} ${sx},${sy}`);
  // open arrowhead at the point end, oriented along the tangent at the start of the curve
  const tx = sx - cx;
  const ty = sy - cy;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const a = 5.5;
  const spread = 0.55;
  const l1x = sx - a * (ux * Math.cos(spread) - uy * Math.sin(spread));
  const l1y = sy - a * (uy * Math.cos(spread) + ux * Math.sin(spread));
  const l2x = sx - a * (ux * Math.cos(-spread) - uy * Math.sin(-spread));
  const l2y = sy - a * (uy * Math.cos(-spread) + ux * Math.sin(-spread));
  c.append('path').attr('class', 'callout-leader').attr('d', `M${l1x},${l1y} L${sx},${sy} L${l2x},${l2y}`);
  labelBox(c, bx, by, bw, text);
}

/** The 2016 reference: a dashed muted line with a small mono label at its top end. `labelY` is the label baseline (plot coords). */
export function drawPaperMarker(g: G, px: number, h: number, w: number, label = '2016 · the paper', labelY = -14): void {
  const m = g.append('g').attr('class', 'paper-marker');
  m.append('line').attr('class', 'paper-line').attr('x1', px).attr('x2', px).attr('y1', label ? labelY + 6 : 0).attr('y2', h);
  if (!label) return;
  const anchor = px > w - 110 ? 'end' : px < 110 ? 'start' : 'middle';
  m.append('text')
    .attr('class', 'paper-label')
    .attr('x', px + (anchor === 'end' ? -6 : anchor === 'start' ? 6 : 0))
    .attr('y', labelY)
    .attr('text-anchor', anchor)
    .text(label);
}

/** A plain story-point dot (no label), for points annotated with a callout instead. */
export function drawPoint(g: G, px: number, py: number): void {
  g.append('circle').attr('class', 'pt').attr('cx', px).attr('cy', py).attr('r', 4);
}

export interface PointLabel {
  /** Primary text, e.g. "28.5%". */
  text: string;
  /** Secondary text under it, e.g. "2015-16". */
  sub?: string;
  /** Vertical placement relative to the point. */
  place?: 'above' | 'below';
  /** Horizontal anchor override. */
  anchor?: 'start' | 'middle' | 'end';
}

/** 8px circle with a 2.5px paper ring + Archivo 13px label with a paper halo; placement avoids the plot edges. */
export function drawStoryPoint(g: G, px: number, py: number, w: number, label: PointLabel): void {
  const pt = g.append('g').attr('class', 'story-point');
  drawPoint(pt, px, py);
  const anchor = label.anchor ?? (px > w - 70 ? 'end' : px < 70 ? 'start' : 'middle');
  const dx = anchor === 'end' ? -10 : anchor === 'start' ? 10 : 0;
  const above = (label.place ?? 'above') === 'above';
  const y1 = above ? py - 12 : py + 25;
  pt.append('text').attr('class', 'pt-label').attr('x', px + dx).attr('y', y1).attr('text-anchor', anchor).text(label.text);
  if (label.sub) {
    pt.append('text')
      .attr('class', 'pt-sub')
      .attr('x', px + dx)
      .attr('y', above ? y1 - 15 : y1 + 14)
      .attr('text-anchor', anchor)
      .text(label.sub);
  }
}

/** "FIG. 1-1 · 1998–2026 · NBA.COM": the mono caption for the panel frame. */
export function panelCaption(num: string, firstYear: number, lastYear: number, url: string): string {
  return `${num} · ${firstYear}–${lastYear} · ${hostOf(url)}`.toUpperCase();
}

/** Solid chip background for in-chart boxes (stats box): rounded, flat, no border, no shadow. */
export function chipRect(g: G, w: number, h: number): void {
  g.append('rect').attr('class', 'chip').attr('width', w).attr('height', h).attr('rx', 4).attr('ry', 4);
}

/** Small legend: list of {label, kind} drawn right-aligned at (x, y). */
export function drawLegend(g: G, x: number, y: number, items: { label: string; kind: 'series' | 'thin' }[]): void {
  const lg = g.append('g').attr('class', 'legend-chip');
  let cx = x;
  const widths = items.map((it) => 30 + it.label.length * 7 + 14);
  const total = widths.reduce((a, b) => a + b, 0);
  cx = x - total;
  items.forEach((it, i) => {
    const row = lg.append('g').attr('transform', `translate(${cx},${y})`);
    row.append('line').attr('class', `legend-${it.kind}`).attr('x1', 0).attr('x2', 22).attr('y1', 0).attr('y2', 0);
    row.append('text').attr('x', 28).attr('y', 4).text(it.label);
    cx += widths[i];
  });
}

/**
 * Tween a numeric attribute with requestAnimationFrame, or jump under prefers-reduced-motion.
 * Deliberately not selection.transition(): the d3 meta-package is marked sideEffects:false, so a
 * production bundle that never references a d3-transition export drops the prototype patch and
 * `.transition()` / `.interrupt()` disappear from selections at runtime.
 */
/** cubic-bezier(.23, 1, .32, 1) — the "ease out" used for every eased reveal. */
export function easeOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = [0.23, 1, 0.32, 1];
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  let lo = 0;
  let hi = 1;
  let u = t;
  for (let i = 0; i < 24; i++) {
    const xv = bx(u);
    if (Math.abs(xv - t) < 1e-4) break;
    if (xv < t) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return by(u);
}

const tweens = new WeakMap<Element, number>();
export function tweenAttr<T extends Element>(sel: Sel<T>, attr: string, value: number, ms = 420): void {
  const node = sel.node();
  if (!node) return;
  const prev = tweens.get(node);
  if (prev !== undefined) cancelAnimationFrame(prev);
  if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
    sel.attr(attr, value);
    return;
  }
  const from = Number(node.getAttribute(attr)) || 0;
  if (from === value) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    sel.attr(attr, from + (value - from) * easeOut(t));
    if (t < 1) tweens.set(node, requestAnimationFrame(step));
    else tweens.delete(node);
  };
  tweens.set(node, requestAnimationFrame(step));
}

/** d3.line through {x,y} in data space. */
export function linePath(x: Linear, y: Linear): d3.Line<{ x: number; y: number }> {
  return d3
    .line<{ x: number; y: number }>()
    .x((d) => x(d.x))
    .y((d) => y(d.y));
}

/**
 * Default label placement for story points, with one collision rule: when the latest point sits
 * within `gap` px of the peak, the latest label goes below (or above if the peak's is below).
 */
export function placeStoryLabels<T extends { year: number; v: number }>(
  pts: { kind: 'first' | 'paper' | 'peak' | 'latest'; p: T }[],
  px: (p: T) => number,
  py: (p: T) => number,
  h: number,
  gap = 80,
): Map<number, 'above' | 'below'> {
  const out = new Map<number, 'above' | 'below'>();
  const peak = pts.find((s) => s.kind === 'peak');
  const latest = pts.find((s) => s.kind === 'latest');
  for (const s of pts) out.set(s.p.year, s.kind === 'first' ? 'above' : s.kind === 'paper' ? 'below' : 'above');
  if (peak && latest && Math.abs(px(peak.p) - px(latest.p)) < gap) {
    // put the latest label on the side with more room
    out.set(latest.p.year, py(latest.p) > h * 0.5 ? 'above' : 'below');
    if (out.get(latest.p.year) === 'above') out.set(peak.p.year, 'below');
  }
  return out;
}

/** Unique-by-season list of story points: first, 2016, peak, latest (deduplicated, in x order). */
export function storyPoints<T extends { year: number; v: number }>(pts: T[]): { kind: 'first' | 'paper' | 'peak' | 'latest'; p: T }[] {
  if (pts.length === 0) return [];
  const out = new Map<number, { kind: 'first' | 'paper' | 'peak' | 'latest'; p: T }>();
  const add = (kind: 'first' | 'paper' | 'peak' | 'latest', p: T | undefined) => {
    if (p && !out.has(p.year)) out.set(p.year, { kind, p });
  };
  add('first', pts[0]);
  add('paper', pts.find((p) => p.year === 2016));
  add('peak', pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]));
  add('latest', pts[pts.length - 1]);
  return [...out.values()].sort((a, b) => a.p.year - b.p.year);
}
