/**
 * Figure 2 — heat strips of shot usage by distance bucket.
 * Then: two strips (8–16 ft, 24+ ft), 1998–2016 as rows; the 24+ legend reproduced in grey with
 * the paper's SUM numbers (753.9 to 1,310.6) and a note. Now: four strips, one season per column,
 * one percent scale, one accent ramp. HTML grid of focusable buttons; a mono tooltip per season.
 */
import * as d3 from 'd3';
import type { ChartHandle, ChartOptions, DataSource, Mode, ShotBucketRow } from './types';
import { endYear } from './types';
import { Frame, fmtPct1, yy, clamp01 } from './base';
import * as committed from './data';

type Bucket = ShotBucketRow['bucket'];
const BUCKETS: { key: Bucket; label: string }[] = [
  { key: 'lt8', label: 'Under 8 ft' },
  { key: '8_16', label: '8–16 ft' },
  { key: '16_24', label: '16–24 ft' },
  { key: '24plus', label: '24+ ft' },
];
const PAPER_FIRST = 1998;
const PAPER_LAST = 2016;
/** The paper's 24+ ft legend ran 753.9 to 1,310.6 under a "Usage %" label: a Tableau SUM across team rows. */
const ORIGINAL_SUM_LEGEND: [string, string] = ['753.9', '1,310.6'];
/** ≈ 46 rows per season (30 regular-season + 16 playoff team rows) is the factor that reproduces it. */
const SUM_FACTOR = 46;

export type Fig2Handle = ChartHandle;

/** `createFig2(el, opts)` reads data/shot_buckets.json itself; `createFig2(el, rows, opts)` takes rows explicitly. */
export function createFig2(container: HTMLElement, opts?: ChartOptions): Fig2Handle;
export function createFig2(container: HTMLElement, data: ShotBucketRow[], opts?: ChartOptions): Fig2Handle;
export function createFig2(container: HTMLElement, a?: ShotBucketRow[] | ChartOptions, b?: ChartOptions): Fig2Handle {
  const data: ShotBucketRow[] = Array.isArray(a) ? a : committed.shots;
  const opts: ChartOptions = Array.isArray(a) ? b ?? {} : a ?? {};
  const rows = [...data].filter((r) => r.bucket !== 'backcourt').sort((a, b) => endYear(a.season) - endYear(b.season));
  const seasonsAll = [...new Set(rows.map((r) => r.season))];
  const value = (season: string, b: Bucket): number | undefined => rows.find((r) => r.season === season && r.bucket === b)?.usage_pct;

  const state = { mode: opts.mode ?? 'then' as Mode };
  const frame = new Frame(container, 'chart--fig2');
  frame.body.style.position = 'relative';
  const tip = document.createElement('div');
  tip.className = 'heat-tip';
  tip.hidden = true;
  tip.setAttribute('role', 'status');
  tip.setAttribute('aria-live', 'polite');

  const seasons = (): string[] =>
    state.mode === 'then' ? seasonsAll.filter((s) => endYear(s) >= PAPER_FIRST && endYear(s) <= PAPER_LAST) : seasonsAll;
  const bucketsShown = (): typeof BUCKETS => (state.mode === 'then' ? BUCKETS.filter((b) => b.key === '8_16' || b.key === '24plus') : BUCKETS);

  function spec() {
    const ss = seasons();
    const first = ss[0];
    const last = ss[ss.length - 1];
    const v = (s: string, b: Bucket) => value(s, b) ?? NaN;
    if (state.mode === 'then') {
      return {
        num: 'Fig. 2',
        title: `The midrange fades as the three darkens: 8–16 ft from ${fmtPct1(v(first, '8_16'))} to ${fmtPct1(v(last, '8_16'))}, 24+ ft from ${fmtPct1(v(first, '24plus'))} to ${fmtPct1(v(last, '24plus'))}`,
        subtitle: `Shot usage % by distance · ${PAPER_FIRST}–${PAPER_LAST} · two strips, as in the paper`,
        note: `The paper's 24+ ft legend (${ORIGINAL_SUM_LEGEND[0]} to ${ORIGINAL_SUM_LEGEND[1]}, kept in grey) is a Tableau SUM across about ${SUM_FACTOR} team rows, not a percentage; the cells use the true share.`,
      };
    }
    const mid = (s: string) => v(s, '8_16') + v(s, '16_24');
    // Anchor the headline on the paper's first season: in 1996-97 the line was 22 ft, so that season's
    // threes mostly land in the 16–24 ft bucket and the 24+ bucket is not comparable.
    const base = ss.includes('1997-98') ? '1997-98' : first;
    const span = ss.length >= 25 ? `${ss.length} seasons on one scale` : `${ss.length} season${ss.length === 1 ? '' : 's'} on one scale`;
    const midClause =
      base !== last
        ? `the two midrange bands fell from ${fmtPct1(mid(base))} to ${fmtPct1(mid(last))} of shots, 24+ ft rose from ${fmtPct1(v(base, '24plus'))} to ${fmtPct1(v(last, '24plus'))}`
        : `midrange ${fmtPct1(mid(base))} of shots, 24+ ft ${fmtPct1(v(base, '24plus'))}`;
    const has9697 = ss.includes('1996-97');
    return {
      num: 'Fig. 2',
      title: `${span}: ${midClause}`,
      subtitle: `Shot usage % by distance · ${endYear(first)}–${endYear(last)} · one percent scale, one ramp`,
      note: has9697
        ? `1996-97 is shown but not in the headline: with the line at 22 ft that season, most threes land in the 16–24 ft bucket (${fmtPct1(v('1996-97', '16_24'))}) and 24+ ft reads only ${fmtPct1(v('1996-97', '24plus'))}.`
        : undefined,
    };
  }

  function alt(): string {
    const ss = seasons();
    if (ss.length === 0) return 'No seasons available yet for shot usage by distance.';
    const first = ss[0];
    const last = ss[ss.length - 1];
    const parts = bucketsShown().map((b) => `${b.label} ${fmtPct1(value(first, b.key) ?? NaN)} to ${fmtPct1(value(last, b.key) ?? NaN)}`);
    return `Share of shots by distance, ${first} to ${last}: ${parts.join('; ')}.`;
  }

  function source(): DataSource {
    const ss = seasons();
    const bs = bucketsShown();
    const out: Record<string, unknown>[] = ss.map((s) => {
      const r: Record<string, unknown> = { season: s };
      for (const b of bs) r[`${b.key}_usage_pct`] = value(s, b.key) ?? '';
      if (state.mode === 'then') r['24plus_original_sum_scale'] = Math.round((value(s, '24plus') ?? 0) * SUM_FACTOR * 10) / 10;
      return r;
    });
    const any = rows.find((r) => r.season === ss[0]);
    return { file: 'data/shot_buckets.json', pulledAt: any?.pulled_at ?? '', url: any?.source_url ?? 'https://stats.nba.com', rows: out };
  }

  /* ---------- tooltip + keyboard ---------- */
  let cells: HTMLButtonElement[][] = []; // [row][col]
  const hide = () => {
    tip.hidden = true;
    frame.body.querySelectorAll('.heat-cell.is-col').forEach((c) => c.classList.remove('is-col'));
  };
  function show(cell: HTMLButtonElement): void {
    const season = cell.dataset.season ?? '';
    const bucketKey = cell.dataset.bucket as Bucket;
    hide();
    frame.body.querySelectorAll<HTMLButtonElement>(`.heat-cell[data-season="${season}"]`).forEach((c) => c.classList.add('is-col'));
    tip.replaceChildren();
    const head = document.createElement('b');
    head.textContent = season;
    tip.appendChild(head);
    for (const b of bucketsShown()) {
      const line = document.createElement('div');
      line.className = b.key === bucketKey ? 'is-on' : '';
      line.textContent = `${b.label.padEnd(10, ' ')} ${fmtPct1(value(season, b.key) ?? NaN)}`;
      tip.appendChild(line);
    }
    tip.hidden = false;
    const bw = frame.body.clientWidth;
    const tw = tip.offsetWidth;
    const cx = cell.offsetLeft + cell.offsetWidth / 2;
    const left = Math.max(tw / 2, Math.min(bw - tw / 2, cx));
    tip.style.left = `${left}px`;
    tip.style.top = `${cell.offsetTop - 6}px`;
    tip.style.transform = 'translate(-50%, -100%)';
  }
  function onKey(e: KeyboardEvent): void {
    const cell = e.currentTarget as HTMLButtonElement;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const moves: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    const mv = moves[e.key];
    if (!mv) {
      if (e.key === 'Escape') hide();
      return;
    }
    e.preventDefault();
    const next = cells[r + mv[0]]?.[c + mv[1]];
    if (next) {
      cell.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }
  }
  /** A cell is a faint outlined box holding one halftone dot whose diameter scales with the value (0 → 2px, max → `dotMax`). */
  function makeCell(season: string, b: { key: Bucket; label: string }, r: number, c: number, size: (v: number) => number): HTMLButtonElement {
    const v = value(season, b.key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'heat-cell';
    btn.dataset.season = season;
    btn.dataset.bucket = b.key;
    btn.dataset.r = String(r);
    btn.dataset.c = String(c);
    btn.tabIndex = r === 0 && c === 0 ? 0 : -1;
    btn.setAttribute('aria-label', `${season}, ${b.label}: ${v === undefined ? 'no data' : fmtPct1(v)}`);
    if (v !== undefined) {
      const dot = document.createElement('span');
      dot.className = 'heat-dot';
      const d = Math.max(2, size(v));
      dot.style.width = `${d}px`;
      dot.style.height = `${d}px`;
      btn.appendChild(dot);
    }
    btn.addEventListener('mouseenter', () => show(btn));
    btn.addEventListener('focus', () => show(btn));
    btn.addEventListener('mouseleave', hide);
    btn.addEventListener('blur', hide);
    btn.addEventListener('keydown', onKey);
    cells[r] ??= [];
    cells[r][c] = btn;
    return btn;
  }
  /** Legend: a row of growing halftone dots from the smallest to the largest cell dot. */
  function legend(dotMax: number, lo: string, hi: string, note?: string, original = false): HTMLElement {
    const el = document.createElement('div');
    el.className = `heat-legend${original ? ' heat-legend--original' : ''}`;
    const b = document.createElement('div');
    b.className = 'heat-legend-bar';
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const s = document.createElement('span');
      s.className = 'heat-legend-step';
      const d = Math.round(2 + (dotMax - 2) * (i / (steps - 1)));
      s.style.width = `${d}px`;
      s.style.height = `${d}px`;
      b.appendChild(s);
    }
    const s = document.createElement('div');
    s.className = 'heat-legend-scale';
    for (const t of [lo, hi]) {
      const span = document.createElement('span');
      span.textContent = t;
      s.appendChild(span);
    }
    el.append(b, s);
    if (note) {
      const n = document.createElement('div');
      n.className = 'heat-legend-note';
      n.textContent = note;
      el.appendChild(n);
    }
    return el;
  }

  function render(): void {
    if (seasons().length === 0) {
      frame.setSpec({ num: 'Fig. 2', title: 'No seasons in data/shot_buckets.json yet', subtitle: 'Shot usage % by distance', note: 'Run `make data` in the repo root.' });
      frame.body.replaceChildren();
      return;
    }
    frame.setSpec(spec());
    frame.setSource(source());
    cells = [];
    const ss = seasons();
    const narrowNow = frame.width() < 560;
    const body = frame.body;
    body.replaceChildren();
    body.setAttribute('role', 'group');
    body.setAttribute('aria-label', alt());

    if (state.mode === 'then') {
      // columns: season | 8–16 strip | 24+ strip
      const grid = document.createElement('div');
      grid.className = `heat heat-then${narrowNow ? ' heat--compact' : ''}`;
      grid.style.gridTemplateColumns = 'auto 1fr 1fr';
      const strips = bucketsShown();
      // Then rows are 22px tall: dots run 2px → 18px across each strip's own range (as the paper's two legends did)
      const dotMax = 18;
      const scales = strips.map((b) => {
        const vals = ss.map((s) => value(s, b.key) ?? NaN).filter((v) => !Number.isNaN(v));
        return d3.scaleLinear().domain([d3.min(vals) ?? 0, d3.max(vals) ?? 1]).range([2, dotMax]);
      });
      const blank = () => document.createElement('div');
      grid.appendChild(blank());
      strips.forEach((b) => {
        const t = document.createElement('p');
        t.className = 'heat-strip-title';
        t.textContent = b.key === '8_16' ? 'Midrange · 8–16 ft usage %' : 'Three · 24+ ft usage %';
        grid.appendChild(t);
      });
      ss.forEach((s, r) => {
        const lab = document.createElement('div');
        lab.className = 'heat-col-label heat-col-label--season';
        lab.textContent = s;
        grid.appendChild(lab);
        strips.forEach((b, c) => grid.appendChild(makeCell(s, b, r, c, (v) => scales[c](v))));
      });
      grid.appendChild(blank());
      strips.forEach((b, c) => {
        const [lo, hi] = scales[c].domain();
        if (b.key === '24plus') {
          grid.appendChild(
            legend(dotMax, ORIGINAL_SUM_LEGEND[0], ORIGINAL_SUM_LEGEND[1], 'original scale (a Tableau SUM across team rows), see note', true),
          );
        } else {
          grid.appendChild(legend(dotMax, fmtPct1(lo), fmtPct1(hi)));
        }
      });
      body.append(grid, tip);
      return;
    }

    // Now: rows = buckets, columns = seasons, one scale
    const n = ss.length;
    const grid = document.createElement('div');
    grid.className = `heat heat-now${narrowNow ? ' heat--compact' : ''}`;
    grid.style.gridTemplateColumns = `auto repeat(${n}, minmax(0, 1fr))`;
    const vmax = d3.max(rows.filter((r) => ss.includes(r.season)), (r) => r.usage_pct) ?? 50;
    // one scale for all four strips: 0 → 2px, max → the largest dot the cell can hold (spec: 0 → 1px radius, 45% → 9px)
    const rowH = narrowNow ? 26 : 34;
    const colW = Math.max(8, (frame.width() - 70 - 4 * n) / n);
    const dotMax = Math.max(6, Math.min(18, Math.floor(Math.min(rowH, colW)) - 6));
    const scale = d3.scaleLinear().domain([0, vmax]).range([2, dotMax]);
    BUCKETS.forEach((b, r) => {
      const lab = document.createElement('div');
      lab.className = 'heat-row-label';
      lab.textContent = b.label;
      grid.appendChild(lab);
      ss.forEach((s, c) => {
        const cell = makeCell(s, b, r, c, (v) => scale(v));
        cell.style.minHeight = `${rowH}px`;
        grid.appendChild(cell);
      });
    });
    // season axis: label every k-th column so labels never collide
    grid.appendChild(document.createElement('div'));
    const step = Math.max(1, Math.ceil(30 / (colW + 4)));
    ss.forEach((s, c) => {
      const lab = document.createElement('div');
      lab.className = 'heat-col-label';
      const y = endYear(s);
      if (c % step === 0 || c === n - 1) lab.textContent = yy(y);
      if (c === n - 1 && (n - 1) % step !== 0 && ((n - 1) % step) * colW < 24) lab.textContent = '';
      grid.appendChild(lab);
    });
    body.append(grid, legend(dotMax, '0%', fmtPct1(vmax)), tip);
  }

  render();
  frame.observe(render);

  return {
    el: frame.root,
    setMode(mode: Mode) {
      state.mode = mode;
      render();
    },
    setProgress(t: number) {
      // Heat strips have nothing to extend; progress only eases the footer in.
      frame.foot.style.opacity = String(0.6 + 0.4 * clamp01(t));
    },
    alt,
    source,
    destroy() {
      frame.destroy();
    },
  };
}

export const fig2SumFactor = SUM_FACTOR;
