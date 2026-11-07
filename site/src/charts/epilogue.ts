/**
 * Epilogue — three-point attempts per team-game, every season in the data.
 * Poster-sized line (4px), the 2016 marker, the 2024-25 high, the latest point, a pull-date stamp.
 */
import * as d3 from 'd3';
import type { ChartHandle, ChartOptions, DataSource, LeagueRow, Mode } from './types';
import { endYear } from './types';
import {
  Frame, type G, type Sel, aspect, marginFor, clamp01, fmt1, nextId, isoDate, inRange,
  yearTicks, drawYGrid, drawXAxisYears, drawYAxis, yAxisTitle, drawSeries, drawPaperMarker,
  drawStoryPoint, drawPoint, drawCallout, tweenAttr, linePath, areaPath, halftonePattern, panelFrame, panelCaption,
  storyPoints, placeStoryLabels,
} from './base';
import * as committed from './data';

export type EpilogueHandle = ChartHandle;

interface Pt { season: string; year: number; v: number }

/** `createEpilogue(el, opts)` reads data/league.json itself; `createEpilogue(el, rows, opts)` takes rows explicitly. */
export function createEpilogue(container: HTMLElement, opts?: ChartOptions): EpilogueHandle;
export function createEpilogue(container: HTMLElement, data: LeagueRow[], opts?: ChartOptions): EpilogueHandle;
export function createEpilogue(container: HTMLElement, a?: LeagueRow[] | ChartOptions, b?: ChartOptions): EpilogueHandle {
  const data: LeagueRow[] = Array.isArray(a) ? a : committed.league;
  const opts: ChartOptions = Array.isArray(a) ? b ?? {} : a ?? {};
  const rows = [...data].sort((a, b) => endYear(a.season) - endYear(b.season));
  const pts: Pt[] = rows.map((r) => ({ season: r.season, year: endYear(r.season), v: r.fg3a }));
  // Progress defaults to 1 so the chart is whole for shells that never drive it.
  const state = { mode: opts.mode ?? 'now' as Mode, progress: 1 };
  const frame = new Frame(container, 'chart--epilogue');
  const clipId = nextId('epi-clip');
  const patId = nextId('epi-dots');
  let clipRect: Sel<SVGRectElement> | null = null;
  let revealX: (t: number) => number = () => 0;
  const stamp = document.createElement('p');
  stamp.className = 'chart-stamp';

  const first = () => pts[0];
  const latest = () => pts[pts.length - 1];
  const peak = () => pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);
  const at2016 = () => pts.find((p) => p.year === 2016);

  function spec() {
    const f = first();
    const l = latest();
    const pk = peak();
    const p16 = at2016();
    // The paper's first season (1997-98) anchors the "took N seasons" count; 1996-97 is plotted but footnoted.
    const paperFirst = pts.find((p) => p.year === 1998) ?? f;
    const post = pts.filter((p) => p.year > 2016);
    const dips = post.filter((p) => { const prev = pts[pts.indexOf(p) - 1]; return prev && p.v < prev.v; }).map((p) => p.season);
    let title: string;
    if (p16 && pk.year > p16.year) {
      title = `${fmt1(paperFirst.v)} to ${fmt1(p16.v)} took ${p16.year - paperFirst.year} seasons; ${fmt1(p16.v)} to ${fmt1(pk.v)} took ${pk.year - p16.year}.${l.year !== pk.year ? ` Then ${fmt1(l.v)}.` : ''}`;
    } else if (p16) {
      title = `${fmt1(paperFirst.v)} to ${fmt1(p16.v)} attempts a game took ${p16.year - paperFirst.year} seasons.`;
    } else {
      title = `${fmt1(f.v)} attempts a game in ${f.season}, ${fmt1(l.v)} in ${l.season}${pk.year !== l.year && pk.year !== f.year ? `, a high of ${fmt1(pk.v)} in ${pk.season}` : ''}.`;
    }
    return {
      num: 'Epilogue',
      title,
      subtitle: `3PA per team-game · ${f.season}–${l.season} · every season in the data`,
      note: dips.length
        ? `Since the paper, attempts fell year over year ${dips.length === 1 ? 'once' : `${dips.length} times`} (${dips.join(', ')}), which is why this ends on a question.`
        : p16
          ? undefined
          : `Only ${pts.length} season${pts.length === 1 ? '' : 's'} present in data/league.json so far.`,
    };
  }

  function alt(): string {
    if (pts.length === 0) return 'No seasons available yet for three-point attempts per team-game.';
    const f = first();
    const l = latest();
    const pk = peak();
    const p16 = at2016();
    const s = [`${fmt1(f.v)} in ${f.season}`];
    if (p16 && p16.year !== f.year) s.push(`${fmt1(p16.v)} in 2015-16`);
    if (pk.year !== f.year && pk.year !== p16?.year) s.push(`a high of ${fmt1(pk.v)} in ${pk.season}`);
    if (l.year !== f.year && l.year !== pk.year && l.year !== p16?.year) s.push(`${fmt1(l.v)} in ${l.season}`);
    return `Three-point attempts per team-game: ${s.join(', ')}.`;
  }

  function source(): DataSource {
    return {
      file: 'data/league.json',
      pulledAt: rows[rows.length - 1]?.pulled_at ?? '',
      url: rows[0]?.source_url ?? 'https://stats.nba.com',
      rows: rows.map((r) => ({ season: r.season, fg3a: r.fg3a })),
    };
  }

  function render(): void {
    const W = frame.width();
    if (!W) return;
    if (pts.length === 0) {
      frame.setSpec({ num: 'Epilogue', title: 'No seasons in data/league.json yet', subtitle: '3PA per team-game', note: 'Run `make data` in the repo root.' });
      frame.svg(W, 10, alt());
      return;
    }
    frame.setSpec(spec());
    frame.setSource(source());
    const l = latest();
    stamp.textContent = `Data through ${l.season} · pulled ${isoDate(rows[rows.length - 1].pulled_at)}`;

    const H = Math.round(W * aspect(W));
    const m = marginFor(W);
    const w = W - m.left - m.right;
    const h = H - m.top - m.bottom;
    const svg = frame.svg(W, H, alt());
    if (stamp.parentElement !== frame.body) frame.body.appendChild(stamp);
    const years = pts.map((p) => p.year);
    panelFrame(svg, W, H, panelCaption('Epilogue', years[0], years[years.length - 1], rows[0]?.source_url ?? ''));
    const g: G = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, w]);
    const yMax = Math.max(10, Math.ceil(((d3.max(pts, (p) => p.v) ?? 40) + 3) / 5) * 5);
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
    const yTicks = d3.range(0, yMax + 0.01, 10);

    drawYGrid(g, y, w, yTicks);
    drawYAxis(g, y, yTicks, (v) => String(v));
    drawXAxisYears(g, x, h, yearTicks(years, w));
    yAxisTitle(g, '3PA per game', h, W < 560 ? -34 : -42);
    if (inRange(2016, years)) drawPaperMarker(g, x(2016), h, w);

    svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('x', -8).attr('y', -m.top).attr('height', H);
    clipRect = svg.select<SVGRectElement>(`#${clipId} rect`);
    revealX = (t) => clamp01(t) * (w + m.right + 8);
    clipRect.attr('width', revealX(state.progress));
    const body: G = g.append('g').attr('clip-path', `url(#${clipId})`);

    const xy = pts.map((p) => ({ x: p.year, y: p.v }));
    drawSeries(body, linePath(x, y)(xy) ?? '', { area: areaPath(x, y, h)(xy) ?? '', patternId: halftonePattern(svg, patId) });
    const sp = storyPoints(pts);
    const places = placeStoryLabels(sp, (p) => x(p.year), (p) => y(p.v), h, 80, pts);
    for (const { kind, p } of sp) {
      if (kind === 'peak' || kind === 'latest') {
        drawPoint(body, x(p.year), y(p.v));
        drawCallout(body, x(p.year), y(p.v), `${p.season}${kind === 'peak' ? ' high' : ''} · ${fmt1(p.v)}`, {
          w, h, overhang: m.right, place: kind === 'peak' ? 'left' : 'below',
        });
        continue;
      }
      drawStoryPoint(body, x(p.year), y(p.v), w, {
        text: fmt1(p.v),
        sub: p.season,
        place: places.get(p.year),
        anchor: kind === 'paper' ? 'start' : undefined,
      });
    }
  }

  frame.observe(render);
  render();

  return {
    el: frame.root,
    setMode(mode: Mode) {
      state.mode = mode; // the epilogue has one view; both modes draw every season
      render();
    },
    setProgress(t: number) {
      state.progress = clamp01(t);
      if (clipRect) tweenAttr(clipRect, 'width', revealX(state.progress), 600);
    },
    alt,
    source,
    destroy() {
      frame.destroy();
    },
  };
}
