/**
 * Figure 3 — Curry's made threes per game against the league's 24+ ft share.
 * Then: the paper's seven seasons (2009-10..2015-16) on its SUM scale (≈ pct × 46), OLS trend, R², n, p.
 * Now: percent scale; a scrubber adds seasons after 2016; x can swap to Curry's age.
 * The stats box always renders: R² and n are never off screen.
 */
import * as d3 from 'd3';
import type { ChartHandle, ChartOptions, CurryRow, DataSource, Mode, ShotBucketRow } from './types';
import { endYear } from './types';
import {
  Frame, type G, marginFor, clamp01, fmt1, fmt2, fmtInt, aspect,
  drawYGrid, drawYAxis, yAxisTitle, drawStoryPoint, drawPoint, storyPoints, chipRect, panelFrame, panelCaption,
} from './base';
import { ols, type OlsResult } from './stats';
import * as committed from './data';

export type XVar = 'curry3pm' | 'age';
export interface Fig3Data {
  curry: CurryRow[];
  shots: ShotBucketRow[];
}
export interface Fig3Options extends ChartOptions {
  x?: XVar;
  /** Initial selected seasons by end year. Default: the paper's 2010..2016. */
  seasons?: number[];
}
export interface Fig3Handle extends ChartHandle {
  setSeasons(endYears: number[]): void;
  setX(x: XVar): void;
  seasons(): number[];
  /** The live fit for the selected seasons: R², r, n, two-sided p. */
  stats(): { r2: number; r: number; n: number; p: number };
  /** Full OLS result (slope, intercept, t, df, se as well). */
  fit(): OlsResult;
  /** All seasons available to the scrubber, by end year. */
  available(): number[];
}

interface Pt { season: string; year: number; curry3pm: number; age: number; league: number; url: string; pulled: string }

const PAPER_SEASONS = [2010, 2011, 2012, 2013, 2014, 2015, 2016];
const PAPER_LAST = 2016;
/** The paper's y ran 0..1,300 under "Usage %": a SUM across ~46 team rows per season. Approximate. */
const SUM_FACTOR = 46;
const PAPER_R2 = 0.896695;
const PAPER_P = 0.0012104;

const isFig3Data = (v: unknown): v is Fig3Data => !!v && typeof v === 'object' && Array.isArray((v as Fig3Data).curry);

/** `createFig3(el, opts)` reads data/*.json itself; `createFig3(el, data, opts)` takes rows explicitly. */
export function createFig3(container: HTMLElement, opts?: Fig3Options): Fig3Handle;
export function createFig3(container: HTMLElement, data: Fig3Data, opts?: Fig3Options): Fig3Handle;
export function createFig3(container: HTMLElement, a?: Fig3Data | Fig3Options, b?: Fig3Options): Fig3Handle {
  const data: Fig3Data = isFig3Data(a) ? a : { curry: committed.curry, shots: committed.shots };
  const opts: Fig3Options = isFig3Data(a) ? b ?? {} : a ?? {};
  const league = new Map(data.shots.filter((r) => r.bucket === '24plus').map((r) => [r.season, r]));
  const all: Pt[] = data.curry
    .filter((c) => league.has(c.season))
    .map((c) => {
      const l = league.get(c.season)!;
      return { season: c.season, year: endYear(c.season), curry3pm: c.fg3m_per_game, age: c.age, league: l.usage_pct, url: c.source_url, pulled: c.pulled_at };
    })
    .sort((a, b) => a.year - b.year);
  const post = all.map((p) => p.year).filter((y) => y > PAPER_LAST);

  const state = {
    mode: opts.mode ?? 'then' as Mode,
    x: opts.x ?? 'curry3pm' as XVar,
    selected: new Set<number>(opts.seasons ?? PAPER_SEASONS),
    progress: 0,
  };
  const frame = new Frame(container, 'chart--fig3');

  const selectedPts = (): Pt[] => all.filter((p) => state.selected.has(p.year));
  const xOf = (p: Pt): number => (state.x === 'age' ? p.age : p.curry3pm);
  const yOf = (p: Pt): number => (state.mode === 'then' ? p.league * SUM_FACTOR : p.league);
  const fit = (): OlsResult => {
    const pts = selectedPts();
    return ols(pts.map(xOf), pts.map(yOf));
  };

  function spec() {
    const f = fit();
    const pts = selectedPts();
    const r2 = fmt2(f.r2);
    const xLabel = state.x === 'age' ? "Curry's age" : "Curry's made threes per game";
    const range = pts.length ? `${pts[0].season}–${pts[pts.length - 1].season}` : 'no overlapping seasons yet';
    const subtitle = `${xLabel} vs league 24+ ft usage % · ${range} · n ${f.n}`;
    if (f.n < 3) {
      return {
        num: 'Fig. 3',
        title: f.n === 0 ? 'No seasons to correlate yet: n = 0' : `Too few seasons for a trend: n = ${f.n}`,
        subtitle,
        note:
          all.length === 0
            ? 'Figure 3 needs seasons present in both data/curry.json and data/shot_buckets.json; none overlap yet.'
            : `Add seasons with the scrubber; ${all.length} are available (${all[0].season}–${all[all.length - 1].season}).`,
      };
    }
    if (state.mode === 'then') {
      return {
        num: 'Fig. 3',
        title: `Seven seasons, one trend: R² ${r2} between Curry's makes and the league's long shots`,
        subtitle: `${subtitle} · the paper's frame, y 0 to 1,300`,
        note: `The paper reported R² ${PAPER_R2.toFixed(3)}, p ${PAPER_P.toFixed(4)}; its "Usage %" axis runs to 1,300 because it is a SUM across about ${SUM_FACTOR} team rows (approximate factor, correlation unchanged).`,
      };
    }
    if (state.x === 'age') {
      return {
        num: 'Fig. 3',
        title: `Curry's age fits the league just as well: r ${fmt2(f.r)} on ${f.n} seasons`,
        subtitle,
        note: 'Any two series that rise together correlate. Age rises every season by construction.',
      };
    }
    const extra = f.n - PAPER_SEASONS.length;
    return {
      num: 'Fig. 3',
      title:
        extra > 0
          ? `Add the ${extra} season${extra === 1 ? '' : 's'} since the paper and R² falls to ${r2} on ${f.n} points`
          : `The same seven points on a percent scale: R² ${r2}, unchanged by the axis`,
      subtitle,
      note: extra > 0 ? 'Curry plateaus near four to five makes a game while the league keeps climbing.' : undefined,
    };
  }

  function alt(): string {
    const f = fit();
    const pts = selectedPts();
    const xLabel = state.x === 'age' ? "Curry's age" : "Curry's three-point makes per game";
    if (f.n < 3) return `${xLabel} against the league's share of shots from 24 feet or more: ${f.n} season${f.n === 1 ? '' : 's'} selected, not enough for a trend.`;
    return `${xLabel} against the league's share of shots from 24 feet or more, ${f.n} seasons (${pts[0].season} to ${pts[pts.length - 1].season}): R² ${fmt2(f.r2)}, r ${fmt2(f.r)}, p ${fmtP(f.p)}.`;
  }

  function source(): DataSource {
    const pts = selectedPts();
    return {
      file: 'data/curry.json + data/shot_buckets.json',
      pulledAt: pts[0]?.pulled ?? '',
      url: pts[0]?.url ?? 'https://stats.nba.com',
      rows: pts.map((p) => {
        const r: Record<string, unknown> = { season: p.season, curry_fg3m_per_game: p.curry3pm, curry_age: p.age, league_24plus_usage_pct: p.league };
        if (state.mode === 'then') r['paper_scale_sum_approx'] = Math.round(p.league * SUM_FACTOR * 10) / 10;
        return r;
      }),
    };
  }

  function render(): void {
    const W = frame.width();
    if (!W) return;
    // Renders even with zero points: axes plus the R²/n box, never an empty card.
    frame.setSpec(spec());
    frame.setSource(source());
    const pts = selectedPts();
    const f = fit();

    const then = state.mode === 'then';
    const compact = W < 560;
    // stats chip geometry is needed early: under 560px it sits below the plot and extends the SVG
    const pairs: [string, string][] = [['n', String(f.n)], ['r', f.n >= 3 ? fmt2(f.r) : '—'], ['p', fmtP(f.p)]];
    const line2Chars = pairs.map(([k, v]) => `${k} ${v}`).join('  ').length;
    const bw = compact ? Math.max(180, 28 + Math.ceil(line2Chars * 7.2)) : Math.max(160, 28 + Math.ceil(line2Chars * 7.2));
    const boxH = compact ? (f.n < 3 ? 96 : 78) : f.n < 3 ? 104 : 84;
    const below = compact ? boxH + 24 : 0;
    const H = Math.round(W * aspect(W)) + below;
    const m = { ...marginFor(W), bottom: marginFor(W).bottom + 12 + below };
    const mLeft = then ? m.left + 26 : m.left;
    const w = W - mLeft - m.right;
    const h = H - m.top - m.bottom;
    const svg = frame.svg(W, H, alt());
    panelFrame(svg, W, H, panelCaption('Fig. 3', pts[0]?.year ?? all[0]?.year ?? 2010, pts[pts.length - 1]?.year ?? all[all.length - 1]?.year ?? 2016, pts[0]?.url ?? 'https://stats.nba.com'));
    const g: G = svg.append('g').attr('transform', `translate(${mLeft},${m.top})`);

    const xs = all.map(xOf);
    const xDomain: [number, number] = state.x === 'age' ? [Math.floor((d3.min(xs) ?? 21) - 1), Math.ceil((d3.max(xs) ?? 38) + 1)] : [0, Math.ceil((d3.max(xs) ?? 5.5) + 0.5)];
    const x = d3.scaleLinear().domain(xDomain).range([0, w]);
    const ysSel = pts.map(yOf);
    const yMax = then ? Math.max(1350, Math.ceil(((d3.max(ysSel) ?? 1300) * 1.05) / 100) * 100) : Math.max(45, Math.ceil(((d3.max(ysSel) ?? 40) + 4) / 5) * 5);
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
    const yTicks = then ? d3.range(0, yMax + 1, 200) : d3.range(0, yMax + 0.01, 10);
    const xTicks = state.x === 'age' ? d3.range(xDomain[0], xDomain[1] + 0.01, W < 560 ? 4 : 2) : d3.range(0, xDomain[1] + 0.01, 1);

    drawYGrid(g, y, w, yTicks);
    drawYAxis(g, y, yTicks, (v) => (then ? fmtInt(v) : String(v)));
    const ax = g.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(xTicks).tickFormat((d) => (state.x === 'age' ? String(d) : fmt1(Number(d)))).tickSize(0).tickPadding(10));
    ax.attr('font-family', null).attr('font-size', null).attr('fill', null);
    ax.select('.domain').remove();
    ax.selectAll('.tick line').remove();
    ax.selectAll('.tick text').attr('class', 'axis-text').attr('fill', null);
    ax.append('line').attr('class', 'baseline').attr('x1', 0).attr('x2', w).attr('y1', 0).attr('y2', 0);
    g.append('text').attr('class', 'axis-title').attr('x', w / 2).attr('y', h + 40).attr('text-anchor', 'middle')
      .text(state.x === 'age' ? "Curry's age" : "Curry's made 3s per game");
    yAxisTitle(g, then ? `24+ ft "usage %" · paper's scale ≈ pct × ${SUM_FACTOR}` : '24+ ft usage %', h, then ? (W < 560 ? -56 : -68) : (W < 560 ? -34 : -42));

    // trend line across the x domain (only when the fit exists)
    if (Number.isFinite(f.slope) && f.n >= 3) {
      const [x0, x1] = xDomain;
      const clampY = (v: number) => Math.max(0, Math.min(yMax, v));
      g.append('line').attr('class', 'trend')
        .attr('x1', x(x0)).attr('y1', y(clampY(f.slope * x0 + f.intercept)))
        .attr('x2', x(x1)).attr('y2', y(clampY(f.slope * x1 + f.intercept)));
    }

    // Stats chip placement. Wide: a corner that covers no plotted point (else the fewest).
    // Compact (< 560px): below the plot, under the x-axis title, so it never covers data or labels.
    const pxy = pts.map((p) => [x(xOf(p)), y(yOf(p))] as const);
    type R = { x0: number; x1: number; y0: number; y1: number };
    const covered = (r: R) => pxy.filter(([px, py]) => px > r.x0 - 14 && px < r.x1 + 14 && py > r.y0 - 14 && py < r.y1 + 14).length;
    const candidates: R[] = [
      { x0: 10, x1: 10 + bw, y0: 12, y1: 12 + boxH },
      { x0: w - bw - 10, x1: w - 10, y0: h - boxH - 12, y1: h - 12 },
      { x0: 10, x1: 10 + bw, y0: h - boxH - 12, y1: h - 12 },
      { x0: w - bw - 10, x1: w - 10, y0: 12, y1: 12 + boxH },
    ];
    const boxRect: R = compact
      ? { x0: 0, x1: bw, y0: h + 56, y1: h + 56 + boxH }
      : candidates.reduce((best, r) => (covered(r) < covered(best) ? r : best), candidates[0]);

    // points: plain dots first, then the labeled story points (first, 2016, latest) so labels stay on top
    const labeled = new Map(storyPoints(pts.map((p) => ({ ...p, v: p.league }))).map((s) => [s.p.year, s.kind]));
    const labelW = 7 * 7.5;
    const ordered = [...pts].sort((a, b) => Number(!!labeled.get(a.year) && labeled.get(a.year) !== 'peak') - Number(!!labeled.get(b.year) && labeled.get(b.year) !== 'peak'));
    for (const p of ordered) {
      const px = x(xOf(p));
      const py = y(yOf(p));
      const kind = labeled.get(p.year);
      if (kind && kind !== 'peak') {
        // season labels are ~7 chars; run them rightwards when there is room, and drop below if they would hit the box
        const anchor: 'start' | 'end' = px + 8 + labelW < w ? 'start' : 'end';
        const lx0 = anchor === 'start' ? px + 8 : px - 8 - labelW;
        const hitsBox = (ly0: number, ly1: number) => !compact && lx0 < boxRect.x1 && lx0 + labelW > boxRect.x0 && ly0 < boxRect.y1 && ly1 > boxRect.y0;
        let place: 'above' | 'below' = kind === 'first' ? 'below' : 'above';
        if (place === 'above' && hitsBox(py - 24, py - 8)) place = 'below';
        drawStoryPoint(g, px, py, w, { text: p.season, place, anchor });
      } else {
        drawPoint(g, px, py);
      }
    }
    // x = age swaps the point color to the comparison accent
    if (state.x === 'age') g.selectAll('.pt').classed('pt--alt', true);

    // stats box, top-left, always
    const box = g.append('g').attr('class', 'stat-box').attr('transform', `translate(${boxRect.x0},${boxRect.y0})`);
    chipRect(box, bw, boxH);
    // Two points fit any line exactly; R² and r are only shown once a trend can mean something.
    box.append('text').attr('class', 'stat-key').attr('x', 14).attr('y', 20).text('R²');
    box.append('text').attr('class', 'stat-big').attr('x', 14).attr('y', compact ? 46 : 50).attr('font-size', compact ? 26 : null).text(f.n >= 3 ? fmt2(f.r2) : '—');
    // compact: the chip is an inline block below the plot; wide: the corner chip
    if (compact) {
      // below the plot there is room for one line: "n 17  r 0.68  p 0.0028"
      const l1 = box.append('text').attr('x', 14).attr('y', 66);
      pairs.forEach(([k, v], i) => {
        l1.append('tspan').attr('class', 'stat-key').text(`${i ? '  ' : ''}${k} `);
        l1.append('tspan').text(v);
      });
    } else {
      const line2 = box.append('text').attr('x', 14).attr('y', 70);
      pairs.forEach(([k, v], i) => {
        line2.append('tspan').attr('class', 'stat-key').text(`${i ? '  ' : ''}${k} `);
        line2.append('tspan').text(v);
      });
    }
    if (f.n < 3) box.append('text').attr('class', 'stat-key').attr('x', 14).attr('y', compact ? 84 : 90).text(f.n === 0 ? 'n = 0 · add seasons' : `n = ${f.n} · add seasons`);
  }

  frame.observe(render);
  render();

  const applyProgress = () => {
    const k = Math.round(clamp01(state.progress) * post.length);
    state.selected = new Set([...PAPER_SEASONS, ...post.slice(0, k)]);
    render();
  };

  return {
    el: frame.root,
    setMode(mode: Mode) {
      state.mode = mode;
      if (mode === 'now') applyProgress();
      else render();
    },
    setProgress(t: number) {
      state.progress = clamp01(t);
      if (state.mode === 'now') applyProgress();
    },
    setSeasons(endYears: number[]) {
      // years with no overlapping Curry + league row are ignored
      state.selected = new Set(endYears.filter((y) => all.some((p) => p.year === y)));
      render();
    },
    setX(xv: XVar) {
      state.x = xv;
      render();
    },
    seasons: () => [...state.selected].sort((a, b) => a - b),
    stats: () => {
      const f = fit();
      return { r2: f.r2, r: f.r, n: f.n, p: f.p };
    },
    fit,
    available: () => all.map((p) => p.year),
    alt,
    source,
    destroy() {
      frame.destroy();
    },
  };
}

function fmtP(p: number): string {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.0001) return '< 0.0001';
  return p < 0.01 ? p.toFixed(4) : p.toFixed(3);
}
