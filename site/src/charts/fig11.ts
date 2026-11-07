/**
 * Figure 1-1 — share of shots from 24+ feet, by season.
 * Then: 1998–2016, y 13..29, exactly the paper's frame. Now: 1998–latest from zero,
 * 2016 marker, peak and latest labeled, optional 3PA-rate overlay, scroll-revealed tail.
 */
import * as d3 from 'd3';
import type { ChartHandle, ChartOptions, DataSource, LeagueRow, Mode, ShotBucketRow } from './types';
import { endYear } from './types';
import {
  Frame, type G, type Sel, aspect, marginFor, clamp01, fmt1, fmtPct1, nextId, paperDomain, isNum, inRange,
  yearTicks, drawYGrid, drawXAxisYears, drawYAxis, yAxisTitle, drawSeries, drawPaperMarker,
  drawStoryPoint, drawPoint, drawCallout, drawLegend, tweenAttr, linePath, areaPath, halftonePattern, panelFrame, panelCaption,
  storyPoints, placeStoryLabels,
} from './base';
import * as committed from './data';

export interface Fig11Data {
  shots: ShotBucketRow[];
  /** Optional: league rows for the 3PA-rate overlay. */
  league?: LeagueRow[];
}
export interface Fig11Options extends ChartOptions {
  overlay?: boolean;
}
export interface Fig11Handle extends ChartHandle {
  setOverlay(on: boolean): void;
}

interface Pt { season: string; year: number; v: number; url: string; pulled: string }

const PAPER_FIRST = 1998;
const PAPER_LAST = 2016;

const isFig11Data = (v: unknown): v is Fig11Data => !!v && typeof v === 'object' && Array.isArray((v as Fig11Data).shots);

/** `createFig11(el, opts)` reads data/*.json itself; `createFig11(el, data, opts)` takes rows explicitly. */
export function createFig11(container: HTMLElement, opts?: Fig11Options): Fig11Handle;
export function createFig11(container: HTMLElement, data: Fig11Data, opts?: Fig11Options): Fig11Handle;
export function createFig11(container: HTMLElement, a?: Fig11Data | Fig11Options, b?: Fig11Options): Fig11Handle {
  const data: Fig11Data = isFig11Data(a) ? a : { shots: committed.shots, league: committed.league };
  const opts: Fig11Options = isFig11Data(a) ? b ?? {} : a ?? {};
  const all: Pt[] = data.shots
    .filter((r) => r.bucket === '24plus')
    .map((r) => ({ season: r.season, year: endYear(r.season), v: r.usage_pct, url: r.source_url, pulled: r.pulled_at }))
    .sort((a, b) => a.year - b.year);
  const rate: Pt[] = (data.league ?? [])
    .map((r) => ({ season: r.season, year: endYear(r.season), v: r.fg3a_rate, url: r.source_url, pulled: r.pulled_at }))
    .sort((a, b) => a.year - b.year);

  const state = { mode: opts.mode ?? 'then' as Mode, progress: 0, overlay: opts.overlay ?? false };
  const frame = new Frame(container, 'chart--fig11');
  const clipId = nextId('fig11-clip');
  const patId = nextId('fig11-dots');
  let clipRect: Sel<SVGRectElement> | null = null;
  let revealX: (t: number) => number = () => 0;

  const visible = (): Pt[] =>
    state.mode === 'then' ? all.filter((p) => p.year >= PAPER_FIRST && p.year <= PAPER_LAST) : all.filter((p) => p.year >= PAPER_FIRST);

  const at = (pts: Pt[], year: number) => pts.find((p) => p.year === year);
  const latest = (pts: Pt[]) => pts[pts.length - 1];
  const peak = (pts: Pt[]) => pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);

  const has = (p: Pt | undefined): p is Pt => !!p && isNum(p.v);
  const partialNote = (pts: Pt[]) =>
    at(pts, PAPER_LAST) ? undefined : `Only ${pts.length} season${pts.length === 1 ? '' : 's'} present in data/shot_buckets.json so far; the 2016 reference point is not in the file yet.`;

  function spec() {
    const pts = visible();
    const p98 = at(pts, PAPER_FIRST);
    const p16 = at(pts, PAPER_LAST);
    const first = pts[0];
    const pk = peak(pts);
    const lt = latest(pts);
    if (state.mode === 'then') {
      const both = has(p98) && has(p16);
      return {
        num: 'Fig. 1-1',
        title: both
          ? `Shots beyond 24 feet nearly doubled: ${fmtPct1(p98.v)} to ${fmtPct1(p16.v)}`
          : `Shots beyond 24 feet, ${first.season} to ${lt.season}: ${fmtPct1(first.v)} to ${fmtPct1(lt.v)}`,
        subtitle: `Avg. 24+ ft usage %, per team-game · ${PAPER_FIRST}–${PAPER_LAST} · the paper's frame, y 13 to 29`,
        note: both
          ? `The 2016 figure read about 15.7 and 28; NBA.com's 24+ ft bucket gives ${fmt1(p98.v)} and ${fmt1(p16.v)}, a match within half a point.`
          : partialNote(pts),
      };
    }
    const parts: string[] = [];
    if (has(p16)) parts.push(`${fmtPct1(p16.v)} in 2016`);
    else parts.push(`${fmtPct1(first.v)} in ${first.season}`);
    if (pk.year !== (p16?.year ?? first.year)) parts.push(`${fmtPct1(pk.v)} at the ${pk.season} peak`);
    if (lt.year !== pk.year && lt.year !== (p16?.year ?? first.year)) parts.push(`${fmtPct1(lt.v)} in ${lt.season}`);
    return {
      num: 'Fig. 1-1',
      title: `${has(p16) ? 'After the paper it kept climbing' : 'Shots beyond 24 feet'}: ${parts.join(', ')}`,
      subtitle: `Avg. 24+ ft usage %, per team-game · ${first.year}–${lt.year} · axis from zero`,
      note: state.overlay
        ? 'Dashed grey is the true three-point attempt rate; the 24+ ft bucket misses corner threes, so it runs a point or two under.'
        : partialNote(pts),
    };
  }

  function alt(): string {
    const pts = visible();
    if (pts.length === 0) return 'No seasons available yet for the share of shots from 24 feet or more.';
    const p16 = at(pts, PAPER_LAST);
    const first = pts[0];
    const pk = peak(pts);
    const lt = latest(pts);
    const s = [`Share of shots from 24 feet or more was ${fmtPct1(first.v)} in ${first.season}`];
    if (has(p16) && p16.year !== first.year) s.push(`${fmtPct1(p16.v)} in 2015-16`);
    if (pk.year !== first.year && pk.year !== p16?.year) s.push(`a peak of ${fmtPct1(pk.v)} in ${pk.season}`);
    if (lt.year !== first.year && lt.year !== pk.year && lt.year !== p16?.year) s.push(`${fmtPct1(lt.v)} in ${lt.season}`);
    return s.join(', ') + '.';
  }

  function source(): DataSource {
    const pts = visible();
    const rows = pts.map((p) => {
      const row: Record<string, unknown> = { season: p.season, '24plus_usage_pct': p.v };
      if (state.mode === 'now' && state.overlay) row.fg3a_rate = at(rate, p.year)?.v ?? '';
      return row;
    });
    return {
      file: 'data/shot_buckets.json',
      pulledAt: pts[0]?.pulled ?? '',
      url: pts[0]?.url ?? 'https://stats.nba.com',
      rows,
    };
  }

  function render(): void {
    const W = frame.width();
    if (!W) return;
    const pts = visible();
    if (pts.length === 0) {
      frame.setSpec({ num: 'Fig. 1-1', title: 'No seasons in data/shot_buckets.json yet', subtitle: 'Avg. 24+ ft usage %, per team-game', note: 'Run `make data` in the repo root.' });
      frame.svg(W, 10, alt());
      return;
    }
    frame.setSpec(spec());
    const src = source();
    frame.setSource(src);

    const H = Math.round(W * aspect(W));
    const m = marginFor(W);
    const w = W - m.left - m.right;
    const h = H - m.top - m.bottom;
    const svg = frame.svg(W, H, alt());
    const years = pts.map((p) => p.year);
    panelFrame(svg, W, H, panelCaption('Fig. 1-1', years[0], years[years.length - 1], src.url));
    const g: G = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, w]);
    const overlayOn = state.mode === 'now' && state.overlay && rate.length > 0;
    const yDomain: [number, number] =
      state.mode === 'then'
        ? paperDomain(13, 29, pts.map((p) => p.v), 2)
        : [0, Math.ceil((d3.max([...pts, ...(overlayOn ? rate : [])], (p) => p.v) ?? 40) / 5) * 5 + 2];
    const y = d3.scaleLinear().domain(yDomain).range([h, 0]);
    const yTicks = state.mode === 'then' ? d3.range(yDomain[0], yDomain[1] + 0.001, 2) : d3.range(0, yDomain[1] + 0.001, 10);

    drawYGrid(g, y, w, yTicks);
    drawYAxis(g, y, yTicks, (v) => String(v));
    drawXAxisYears(g, x, h, yearTicks(years, w));
    yAxisTitle(g, '24+ ft usage %', h, W < 560 ? -34 : -42);

    // 2016 marker (outside the clip so it is always visible); only when 2016 is inside the plotted range
    const x16 = Math.min(x(PAPER_LAST), w);
    if (inRange(PAPER_LAST, years)) drawPaperMarker(g, x16, h, w);

    const line = linePath(x, y)(pts.map((p) => ({ x: p.year, y: p.v }))) ?? '';

    // clip for the scroll-driven reveal of the post-2016 tail (Now mode only)
    let body: G = g;
    if (state.mode === 'now') {
      svg.append('defs').append('clipPath').attr('id', clipId).append('rect')
        .attr('x', -8).attr('y', -m.top).attr('height', H);
      clipRect = svg.select<SVGRectElement>(`#${clipId} rect`);
      revealX = (t) => x16 + 8 + clamp01(t) * (w - x16 + m.right);
      clipRect.attr('width', revealX(state.progress));
      body = g.append('g').attr('clip-path', `url(#${clipId})`);
    } else {
      clipRect = null;
    }

    if (overlayOn) {
      const rpts = rate.filter((p) => p.year >= PAPER_FIRST && p.year <= years[years.length - 1]);
      body.append('path').attr('class', 'series-thin').attr('d', linePath(x, y)(rpts.map((p) => ({ x: p.year, y: p.v }))) ?? '');
      drawLegend(g, w, -30, [
        { label: '24+ ft bucket', kind: 'series' },
        { label: '3PA rate', kind: 'thin' },
      ]);
    }

    drawSeries(body, line, state.mode === 'now'
      ? { area: areaPath(x, y, h)(pts.map((p) => ({ x: p.year, y: p.v }))) ?? '', patternId: halftonePattern(svg, patId) }
      : { variant: 'then' });

    // story points: first, 2016, peak, latest — nothing else labeled
    const sp = storyPoints(pts);
    const places = placeStoryLabels(sp, (p) => x(p.year), (p) => y(p.v), h);
    for (const { kind, p } of sp) {
      const target = state.mode === 'now' && p.year > PAPER_LAST ? body : g;
      if (kind === 'peak' || (kind === 'latest' && state.mode === 'now')) {
        // peak and latest get hand-annotated yellow callouts; the space left of a maximum is empty by construction
        drawPoint(target, x(p.year), y(p.v));
        drawCallout(target, x(p.year), y(p.v), `${p.season}${kind === 'peak' ? ' peak' : ''} · ${fmtPct1(p.v)}`, {
          w, h, overhang: m.right, place: kind === 'peak' ? 'left' : 'below',
        });
        continue;
      }
      drawStoryPoint(target, x(p.year), y(p.v), w, {
        text: fmtPct1(p.v),
        sub: p.season,
        place: places.get(p.year),
        anchor: kind === 'paper' && state.mode === 'then' ? 'end' : kind === 'paper' ? 'start' : undefined,
      });
    }
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
    setOverlay(on: boolean) {
      state.overlay = on;
      render();
    },
    alt,
    source,
    destroy() {
      frame.destroy();
    },
  };
}
