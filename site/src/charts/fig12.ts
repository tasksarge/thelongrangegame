/**
 * Figure 1-2 — three-point makes per team-game.
 * Then: 1998–2016, y 5.0..9.0 like the paper. Now: three aligned panels, 3PM = 3PA × 3P%,
 * the 3P% panel drawn as a flat band between the series' min and max.
 */
import * as d3 from 'd3';
import type { ChartHandle, ChartOptions, DataSource, LeagueRow, Mode } from './types';
import { endYear } from './types';
import {
  Frame, type G, type Sel, marginFor, aspect, clamp01, fmt1, fmtPct1, nextId,
  yearTicks, drawYGrid, drawXAxisYears, drawYAxis, yAxisTitle, drawSeries, drawPaperMarker,
  drawStoryPoint, drawPoint, drawCallout, tweenAttr, linePath, areaPath, halftonePattern, panelFrame, panelCaption,
  storyPoints, placeStoryLabels, axisBreak, paperDomain, isNum, inRange,
} from './base';
import * as committed from './data';

export type Factor = 'fg3m' | 'fg3a' | 'fg3_pct' | 'all';
export interface Fig12Options extends ChartOptions {
  factor?: Factor;
}
export interface Fig12Handle extends ChartHandle {
  setFactor(f: Factor): void;
}

interface Pt { season: string; year: number; v: number }

const PAPER_FIRST = 1998;
const PAPER_LAST = 2016;

/** `createFig12(el, opts)` reads data/league.json itself; `createFig12(el, rows, opts)` takes rows explicitly. */
export function createFig12(container: HTMLElement, opts?: Fig12Options): Fig12Handle;
export function createFig12(container: HTMLElement, data: LeagueRow[], opts?: Fig12Options): Fig12Handle;
export function createFig12(container: HTMLElement, a?: LeagueRow[] | Fig12Options, b?: Fig12Options): Fig12Handle {
  const data: LeagueRow[] = Array.isArray(a) ? a : committed.league;
  const opts: Fig12Options = Array.isArray(a) ? b ?? {} : a ?? {};
  const rows = [...data].sort((a, b) => endYear(a.season) - endYear(b.season));
  const series = (key: 'fg3m' | 'fg3a' | 'fg3_pct', years: number[]): Pt[] =>
    rows.filter((r) => years.includes(endYear(r.season))).map((r) => ({ season: r.season, year: endYear(r.season), v: r[key] }));

  const state = { mode: opts.mode ?? 'then' as Mode, progress: 0, factor: opts.factor ?? 'all' as Factor };
  const frame = new Frame(container, 'chart--fig12');
  const clipId = nextId('fig12-clip');
  const patId = nextId('fig12-dots');
  let clipRect: Sel<SVGRectElement> | null = null;
  let revealX: (t: number) => number = () => 0;
  let panels: Record<string, G> = {};

  const yearsVisible = (): number[] =>
    rows.map((r) => endYear(r.season)).filter((y) => y >= PAPER_FIRST && (state.mode === 'then' ? y <= PAPER_LAST : true));

  const at = (pts: Pt[], year: number) => pts.find((p) => p.year === year);

  const partialNote = (yrs: number[]) =>
    yrs.includes(PAPER_LAST) ? undefined : `Only ${yrs.length} season${yrs.length === 1 ? '' : 's'} present in data/league.json so far; the 2016 reference point is not in the file yet.`;

  function spec() {
    const yrs = yearsVisible();
    const m = series('fg3m', yrs);
    const a = series('fg3a', yrs);
    const pc = series('fg3_pct', rows.map((r) => endYear(r.season)));
    const mFirst = m[0];
    const m16 = at(m, PAPER_LAST);
    const mLast = m[m.length - 1];
    const aLast = a[a.length - 1];
    const pcMin = d3.min(pc, (p) => p.v);
    const pcMax = d3.max(pc, (p) => p.v);
    if (state.mode === 'then') {
      const end = m16 ?? mLast;
      return {
        num: 'Fig. 1-2',
        title: m16
          ? `Made threes per game rose with the attempts: ${fmt1(mFirst.v)} to ${fmt1(m16.v)}`
          : `Made threes per game, ${mFirst.season} to ${end.season}: ${fmt1(mFirst.v)} to ${fmt1(end.v)}`,
        subtitle: `Avg. 3P FGM per team-game · ${PAPER_FIRST}–${PAPER_LAST} · the paper's frame, y 5.0 to 9.0`,
        note: m16 ? 'The paper read this as better shooting; the Now view separates volume from accuracy.' : partialNote(yrs),
      };
    }
    const band = isNum(pcMin) && isNum(pcMax) ? `, while 3P% stayed between ${fmt1(pcMin)} and ${fmt1(pcMax)}` : '';
    return {
      num: 'Fig. 1-2',
      title: `The gain is volume, not accuracy: ${fmt1(mLast.v)} makes on ${fmt1(aLast.v)} attempts in ${mLast.season}${band}`,
      subtitle: `3PM = 3PA × 3P%, per team-game · ${mFirst.year}–${mLast.year} · three aligned panels`,
      note:
        partialNote(yrs) ??
        (isNum(pcMin) && isNum(pcMax)
          ? `3P% has sat in a ${fmt1(pcMax - pcMin)}-point band since ${pc[0]?.season}; its axis starts at 30 (break marked).`
          : undefined),
    };
  }

  function alt(): string {
    const yrs = yearsVisible();
    const m = series('fg3m', yrs);
    const a = series('fg3a', yrs);
    const pc = series('fg3_pct', rows.map((r) => endYear(r.season)));
    if (m.length === 0) return 'No seasons available yet for three-point makes per team-game.';
    const mFirst = m[0];
    const m16 = at(m, PAPER_LAST);
    const mLast = m[m.length - 1];
    const aLast = a[a.length - 1];
    const s = [`Three-point makes per team-game were ${fmt1(mFirst.v)} in ${mFirst.season}`];
    if (m16 && m16.year !== mFirst.year) s.push(`${fmt1(m16.v)} in 2015-16`);
    if (state.mode === 'now' && mLast.year !== (m16?.year ?? mFirst.year)) s.push(`${fmt1(mLast.v)} in ${mLast.season}`);
    let out = s.join(', ');
    if (state.mode === 'now') {
      out += `; attempts went from ${fmt1(a[0]?.v)} to ${fmt1(aLast?.v)}`;
      const lo = d3.min(pc, (p) => p.v);
      const hi = d3.max(pc, (p) => p.v);
      if (isNum(lo) && isNum(hi)) out += `; three-point percentage stayed between ${fmtPct1(lo)} and ${fmtPct1(hi)}`;
    }
    return out + '.';
  }

  function source(): DataSource {
    const yrs = yearsVisible();
    const vis = rows.filter((r) => yrs.includes(endYear(r.season)));
    return {
      file: 'data/league.json',
      pulledAt: vis[0]?.pulled_at ?? '',
      url: vis[0]?.source_url ?? 'https://stats.nba.com',
      rows: vis.map((r) =>
        state.mode === 'then' ? { season: r.season, fg3m: r.fg3m } : { season: r.season, fg3m: r.fg3m, fg3a: r.fg3a, fg3_pct: r.fg3_pct },
      ),
    };
  }

  function applyFactor(): void {
    for (const [k, p] of Object.entries(panels)) {
      p.style('opacity', state.factor === 'all' || state.factor === k ? 1 : 0.35);
    }
  }

  function render(): void {
    const W = frame.width();
    if (!W) return;
    const yrs = yearsVisible();
    if (yrs.length === 0) {
      frame.setSpec({ num: 'Fig. 1-2', title: 'No seasons in data/league.json yet', subtitle: 'Avg. 3P FGM per team-game', note: 'Run `make data` in the repo root.' });
      frame.svg(W, 10, alt());
      return;
    }
    frame.setSpec(spec());
    frame.setSource(source());

    const narrow = W < 560;
    const then = state.mode === 'then';
    // Now mode needs headroom: the 2016 label sits above the first panel's title and its peak label.
    const m = then ? marginFor(W) : { ...marginFor(W), top: 56, bottom: 40 };
    // Same height cap as every chart (0.6 × width wide, 1.0 × width narrow); three panels share it.
    const H = Math.round(W * aspect(W));
    const w = W - m.left - m.right;
    const svg = frame.svg(W, H, alt());
    panelFrame(svg, W, H, panelCaption('Fig. 1-2', yrs[0], yrs[yrs.length - 1], rows[0]?.source_url ?? ''));
    const g: G = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain([yrs[0], yrs[yrs.length - 1]]).range([0, w]);
    const x16 = Math.min(x(PAPER_LAST), w);
    const show16 = inRange(PAPER_LAST, yrs);
    panels = {};

    const drawPanel = (
      parent: G,
      key: 'fg3m' | 'fg3a' | 'fg3_pct',
      top: number,
      ph: number,
      yDomain: [number, number],
      yTicks: number[],
      label: string,
      opt: { band?: boolean; brk?: boolean; xAxis?: boolean; fmt?: (v: number) => string },
    ): G => {
      const pts = series(key, yrs);
      const panel = parent.append('g').attr('class', `panel panel-${key}`).attr('transform', `translate(0,${top})`);
      const y = d3.scaleLinear().domain(yDomain).range([ph, 0]);
      drawYGrid(panel, y, w, yTicks);
      drawYAxis(panel, y, yTicks, opt.fmt ?? ((v) => fmt1(v)));
      if (opt.brk) axisBreak(panel, ph);
      if (opt.xAxis) drawXAxisYears(panel, x, ph, yearTicks(yrs, w));
      else panel.append('line').attr('class', 'baseline').attr('x1', 0).attr('x2', w).attr('y1', ph).attr('y2', ph);
      panel.append('text').attr('class', 'panel-title').attr('x', 0).attr('y', -8).text(label);
      if (opt.band) {
        const lo = d3.min(pts, (p) => p.v) ?? 0;
        const hi = d3.max(pts, (p) => p.v) ?? 0;
        panel.append('rect').attr('class', 'band').attr('x', 0).attr('y', y(hi)).attr('width', w).attr('height', Math.max(1, y(lo) - y(hi)));
        // On narrow screens the chart note carries this sentence; the label would hit the 2016 point label.
        if (!narrow) {
          panel.append('text').attr('class', 'band-label').attr('x', 4).attr('y', y(lo) + 14).attr('text-anchor', 'start')
            .text(`every season between ${fmt1(lo)} and ${fmt1(hi)}%`);
        }
      }
      // body: clipped in Now mode
      const body: G = then ? panel : panel.append('g').attr('clip-path', `url(#${clipId})`);
      // Now mode: the label sits between the panel caption (y≈16 abs) and the first panel title (y=-8)
      if (show16) drawPaperMarker(panel, x16, ph, w, top === 0 ? '2016 · the paper' : '', then ? -14 : -22);
      const xy = pts.map((p) => ({ x: p.year, y: p.v }));
      drawSeries(body, linePath(x, y)(xy) ?? '', then ? { variant: 'then' } : opt.band ? {} : { area: areaPath(x, y, ph)(xy) ?? '', patternId: halftonePattern(svg, patId) });
      // Narrow Now panels are ~60px tall: keep only the 2016 and latest values, no season sub-lines.
      const compact = narrow && !then;
      const sp = storyPoints(pts)
        .filter(({ kind }) => !(opt.band && kind === 'peak')) // the band carries the 3P% range
        .filter(({ kind }) => !compact || kind === 'paper' || kind === 'latest');
      const places = placeStoryLabels(sp, (p) => x(p.year), (p) => y(p.v), ph);
      for (const { kind, p } of sp) {
        const target = !then && p.year > PAPER_LAST ? body : panel;
        if (!compact && (kind === 'peak' || (kind === 'latest' && !then))) {
          drawPoint(target, x(p.year), y(p.v));
          const val = opt.band ? fmtPct1(p.v) : fmt1(p.v);
          drawCallout(target, x(p.year), y(p.v), kind === 'peak' ? `${p.season} peak · ${val}` : val, {
            w, h: ph, overhang: m.right, place: kind === 'peak' ? 'left' : 'right',
          });
          continue;
        }
        drawStoryPoint(target, x(p.year), y(p.v), w, {
          text: opt.band ? fmtPct1(p.v) : fmt1(p.v),
          sub: compact ? undefined : p.season,
          place: places.get(p.year),
          anchor: kind === 'paper' && then ? 'end' : kind === 'paper' ? 'start' : undefined,
        });
      }
      return panel;
    };

    if (then) {
      const h = H - m.top - m.bottom;
      clipRect = null;
      const dom = paperDomain(5, 9, series('fg3m', yrs).map((p) => p.v), 0.5);
      const p = drawPanel(g, 'fg3m', 0, h, dom, d3.range(dom[0], dom[1] + 0.01, 0.5), '', { xAxis: true });
      yAxisTitle(p, 'Avg. 3P FGM', h, narrow ? -34 : -42);
      return;
    }

    // Now: three stacked panels sharing x
    svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('x', -8).attr('y', -m.top).attr('height', H);
    clipRect = svg.select<SVGRectElement>(`#${clipId} rect`);
    revealX = (t) => x16 + 8 + clamp01(t) * (w - x16 + m.right);
    clipRect.attr('width', revealX(state.progress));

    const gap = narrow ? 30 : 34;
    const h = H - m.top - m.bottom;
    const ph = (h - gap * 2) / 3;
    const aMax = Math.max(10, Math.ceil((d3.max(rows, (r) => r.fg3a) ?? 40) / 10) * 10);
    const mMax = Math.max(5, Math.ceil((d3.max(rows, (r) => r.fg3m) ?? 15) / 5) * 5);
    panels.fg3m = drawPanel(g, 'fg3m', 0, ph, [0, mMax], d3.range(0, mMax + 0.01, 5), '3PM per game', { fmt: (v) => String(v) });
    panels.fg3a = drawPanel(g, 'fg3a', ph + gap, ph, [0, aMax], d3.range(0, aMax + 0.01, 10), '3PA per game', { fmt: (v) => String(v) });
    panels.fg3_pct = drawPanel(g, 'fg3_pct', (ph + gap) * 2, ph, [30, 40], d3.range(30, 40.01, 5), '3P%', {
      band: true, brk: true, xAxis: true, fmt: (v) => `${v}`,
    });
    applyFactor();
  }

  frame.observe(render);
  render();

  return {
    el: frame.root,
    setMode(mode: Mode) {
      state.mode = mode;
      render();
    },
    setProgress(t: number) {
      state.progress = clamp01(t);
      if (state.mode !== 'now' || !clipRect) return;
      tweenAttr(clipRect, 'width', revealX(state.progress));
    },
    setFactor(f: Factor) {
      state.factor = f;
      applyFactor();
    },
    alt,
    source,
    destroy() {
      frame.destroy();
    },
  };
}
