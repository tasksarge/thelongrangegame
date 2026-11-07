import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/scenes.css';

import { createEngine, type ChapterDef } from '@/chapters/engine';
import { buildCover, buildDecade, buildEnd, buildGame7, buildNight, buildPaper, buildReport, decadeBeats } from '@/chapters/scenes';
import { act2 } from '@/story/copy';
import { createEpilogue, createFig11, createFig12, createFig2, createFig3, latestSeason } from '@/charts';
import type { ChartHandle, Mode } from '@/charts/types';
import * as gfx from '@/gfx';

const app = document.getElementById('app')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* ---------- build panels ---------- */
const cover = buildCover();
const game7 = buildGame7();
const paper = buildPaper();
const night = buildNight();
const decade = buildDecade();
const report = buildReport();
const end = buildEnd();
const panels = [cover, game7, paper, night, decade, report, end];
panels.forEach((p) => app.appendChild(p));

/* a plate that has not been produced yet must not show a broken-image box */
document.addEventListener('error', (e) => { const t = e.target as HTMLElement; if (t instanceof HTMLImageElement) t.style.visibility = 'hidden'; }, true);

/* highlighter sweeps turn on when their chapter shows */
const armHighlights = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('.hl').forEach((el, i) => setTimeout(() => el.classList.add('is-on'), 120 + i * 140));

/* ---------- chapter 1: game 7 ---------- */
const g7 = {
  score: game7.querySelector<HTMLElement>('#g7-score')!,
  kicker: game7.querySelector<HTMLElement>('#g7-kicker')!,
  cap: game7.querySelector<HTMLElement>('#g7-cap')!,
  board: gfx.createScoreboard(game7.querySelector('#g7-board')!),
  court: gfx.createCourt(game7.querySelector('#g7-court')!, { view: 'half', ground: 'ink' }),
  arrows: null as ReturnType<typeof gfx.createArrows> | null,
};
const g7Beats = [
  { kicker: 'June 19, 2016 · Oracle Arena · Game 7', score: '89–89', clock: '0:53', home: 89, away: 89, cap: 'Score tied. Fifty-three seconds left. The series is 3–3.' },
  { kicker: '0:53 · the shot', score: '92–89', clock: '0:53', home: 89, away: 92, cap: 'Kyrie Irving. Twenty-five feet. Step-back over Stephen Curry.' },
  { kicker: 'Final', score: '93–89', clock: '0:00', home: 89, away: 93, cap: 'Cavaliers 93, Warriors 89. The first team ever to win the Finals from 3–1 down.' },
];
const tween = (fn: (k: number) => void, dur = 900, delay = 0) => {
  const t0 = performance.now() + delay;
  const step = (t: number) => { const k = reduced ? 1 : Math.max(0, Math.min(1, (t - t0) / dur)); fn(k); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
const g7Beat = (b: number) => {
  const d = g7Beats[b];
  g7.kicker.textContent = d.kicker;
  g7.score.textContent = d.score;
  g7.cap.innerHTML = `<p>${esc(d.cap)}</p>`;
  g7.board.set({ home: d.home, away: d.away, clock: d.clock });
  if (b === 1) tween((k) => g7.court.shot({ x: 42, y: 22 }, 16, k));
  else g7.court.shot({ x: 42, y: 22 }, 16, b === 2 ? 1 : 0);
};

/* ---------- chapter 2: paper figures (lazy Then/Now) ---------- */
const figFactories: Record<string, (el: HTMLElement, mode: Mode) => ChartHandle> = {
  '1-1': (el, mode) => createFig11(el, { mode }),
  '1-2': (el, mode) => createFig12(el, { mode }),
  '2': (el, mode) => createFig2(el, { mode }),
  '3': (el, mode) => createFig3(el, { mode }),
};
let paperMounted = false;
const mountPaperFigures = () => {
  if (paperMounted) return; paperMounted = true;
  paper.querySelectorAll<HTMLElement>('.fig-mount').forEach((mount) => {
    const id = mount.dataset.fig!;
    mount.classList.add('chart');
    const handle = figFactories[id](mount, 'then');
    mount.setAttribute('role', 'img');
    mount.setAttribute('aria-label', handle.alt());
    const head = mount.previousElementSibling as HTMLElement;
    const note = mount.nextElementSibling as HTMLElement;
    head.querySelectorAll<HTMLButtonElement>('.toggle button').forEach((b) => b.addEventListener('click', () => {
      const mode = b.dataset.mode as Mode;
      head.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      handle.setMode(mode);
      mount.setAttribute('aria-label', handle.alt());
      note.textContent = mode === 'then' ? 'Then keeps the original\'s range and its flaws, labeled.' : 'Now corrects the scale and extends the range to the latest season.';
    }));
  });
  const notes = paper.querySelectorAll<HTMLElement>('.margin-note');
  notes.forEach((n) => n.classList.add('rise'));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-on'); io.unobserve(e.target); } }), { root: paper, rootMargin: '0px 0px -10% 0px' });
  notes.forEach((n) => io.observe(n));
};

/* ---------- chapter 3: the night before ---------- */
const nightCap = night.querySelector<HTMLElement>('#night-cap')!;
const nightBig = night.querySelector<HTMLElement>('#night-big')!;
const nightGfx = night.querySelector<HTMLElement>('#night-gfx')!;
let nightLive: { destroy(): void } | null = null;
const nightBeat = (b: number) => {
  const beat = act2.beats[b];
  nightCap.classList.toggle('is-quiet', b === 3);
  nightCap.innerHTML = `<span class="kicker">${esc(beat.kicker)}</span>${beat.lines.map((l) => `<p>${b === 4 && l.includes('was a three') ? esc(l).replace('a three', '<span class="hl is-on"><span>a three</span></span>') : esc(l)}</p>`).join('')}`;
  nightBig.textContent = beat.big || '';
  nightLive?.destroy(); nightLive = null; nightGfx.innerHTML = '';
  if (b === 0) { const a = gfx.createArcs(nightGfx, { count: 40 }); nightLive = a; a.play(); }
  else if (b === 1) { const c = gfx.createCounter(nightGfx, { from: 0, to: 3, decimals: 0, suffix: '–1', duration: 900, disc: true }); nightLive = c; c.play(); }
  else if (b === 2) { const c = gfx.createClock(nightGfx); nightLive = c; c.play(); }
  else if (b === 3) { const w = gfx.createWire(nightGfx, { shape: 'torus' }); nightLive = w; w.play(); }
  else if (b === 4) { const a = gfx.createArrows(nightGfx, [{ x: 0.08, y: 0.15 }, { x: 0.92, y: 0.1 }, { x: 0.1, y: 0.9 }, { x: 0.9, y: 0.85 }]); nightLive = a; a.play(); }
  else { const c = gfx.createConfetti(nightGfx); nightLive = c; c.play(); }
};

/* ---------- chapter 4: ten years later ---------- */
const decadeTitle = decade.querySelector<HTMLElement>('#decade-title')!;
const decadeSteps = decade.querySelector<HTMLElement>('#decade-steps')!;
const decadeCap = decade.querySelector<HTMLElement>('#decade-cap')!;
const decadeCharts: Record<string, ChartHandle | null> = { fig11: null, fig12: null, fig2: null, fig3: null };
const decadeCaps: Record<string, string> = { fig11: 'FIG. 1-1 · 24+ FT USAGE · 1998–2026', fig12: 'FIG. 1-2 · 3PM = 3PA × 3P% · 1998–2026', fig2: 'FIG. 2 · SHOT DIET · 1997–2026', fig3: 'FIG. 3 · CURRY VS THE LEAGUE · 2010–2026' };
const fig12Ctl = decade.querySelector<HTMLElement>('#decade-fig12-controls')!;
const fig3Ctl = decade.querySelector<HTMLElement>('#decade-fig3-controls')!;
const fig3Range = fig3Ctl.querySelector<HTMLInputElement>('#fig3-range')!;
const fig3Out = fig3Ctl.querySelector<HTMLOutputElement>('#fig3-out')!;
const latest = latestSeason().endYear;
const years = (to: number) => Array.from({ length: to - 2010 + 1 }, (_, k) => 2010 + k);
const decadeBeat = (b: number) => {
  const d = decadeBeats[b];
  decadeTitle.textContent = d.title;
  decadeSteps.innerHTML = d.steps.map((s) => `<li>${esc(s)}</li>`).join('');
  decadeCap.textContent = decadeCaps[d.id];
  decadeBeats.forEach((x) => { decade.querySelector<HTMLElement>(`#decade-${x.id}`)!.hidden = x.id !== d.id; });
  fig12Ctl.hidden = d.id !== 'fig12'; fig3Ctl.hidden = d.id !== 'fig3';
  const mount = decade.querySelector<HTMLElement>(`#decade-${d.id}`)!;
  if (!decadeCharts[d.id]) {
    const f = { fig11: createFig11, fig12: createFig12, fig2: createFig2, fig3: createFig3 }[d.id as 'fig11'];
    decadeCharts[d.id] = f(mount, { mode: 'now' });
  }
  const hnd = decadeCharts[d.id]!;
  if (d.id === 'fig11' || d.id === 'fig2') { hnd.setProgress(0); tween((k) => hnd.setProgress(k), 1400, 300); }
  if (d.id === 'fig12') hnd.setProgress(1);
  if (d.id === 'fig3') {
    const h3 = hnd as ReturnType<typeof createFig3>;
    h3.setX('curry3pm'); h3.setSeasons(years(2016)); fig3Range.value = '2016'; fig3Out.value = '2016';
    tween((k) => { const to = 2016 + Math.round(k * (latest - 2016)); h3.setSeasons(years(to)); fig3Range.value = String(to); fig3Out.value = String(to); }, 1800, 900);
  }
};
{
  const btns = fig12Ctl.querySelectorAll<HTMLButtonElement>('button');
  btns.forEach((b) => b.addEventListener('click', () => { (decadeCharts.fig12 as ReturnType<typeof createFig12> | null)?.setFactor(b.dataset.f as never); btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  fig3Range.max = String(latest);
  fig3Range.addEventListener('input', () => { const to = Number(fig3Range.value); fig3Out.value = String(to); (decadeCharts.fig3 as ReturnType<typeof createFig3> | null)?.setSeasons(years(to)); });
  fig3Ctl.querySelectorAll<HTMLButtonElement>('.toggle button').forEach((b) => b.addEventListener('click', () => { (decadeCharts.fig3 as ReturnType<typeof createFig3> | null)?.setX(b.dataset.x as 'curry3pm' | 'age'); fig3Ctl.querySelectorAll('.toggle button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
}

/* ---------- chapter 5: evidence dialog ---------- */
{
  const dlg = report.querySelector<HTMLDialogElement>('#evidence')!;
  const mount = dlg.querySelector<HTMLElement>('#evidence-chart')!;
  let live: ChartHandle | null = null;
  report.querySelectorAll<HTMLButtonElement>('.chip[data-chart]:not([disabled])').forEach((b) => b.addEventListener('click', () => {
    if (!b.dataset.chart) return;
    live?.destroy(); mount.innerHTML = '';
    const f = { fig11: createFig11, fig12: createFig12, fig2: createFig2, fig3: createFig3 }[b.dataset.chart as 'fig11'];
    const hnd = f(mount, { mode: 'now' }); live = hnd; hnd.setProgress(1);
    dlg.showModal();
  }));
  dlg.querySelector('.close')!.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- chapter 6: epilogue ---------- */
let epiMounted = false;
const mountEpilogue = () => {
  if (epiMounted) return; epiMounted = true;
  const el = end.querySelector<HTMLElement>('#epilogue-chart')!;
  const hnd = createEpilogue(el, { mode: 'now' }); hnd.setProgress(1);
  const { season, pulledAt } = latestSeason();
  end.querySelector('#data-stamp')!.textContent = `Data through ${season} · pulled ${pulledAt.slice(0, 10)}`;
};

/* ---------- the engine ---------- */
const defs: ChapterDef[] = [
  { id: 'cover', label: 'Cover', beats: 1, onEnter: () => armHighlights(cover) },
  { id: 'game7', label: 'Game 7', beats: 3, dark: true, onEnter: () => { g7.court.play(); if (!g7.arrows) g7.arrows = gfx.createArrows(game7.querySelector('#g7-arrows')!, [{ x: 0.52, y: 0.08 }, { x: 0.97, y: 0.22 }, { x: 0.98, y: 0.95 }, { x: 0.5, y: 0.97 }], { target: { x: 0.74, y: 0.79 }, color: 'chalk', standoff: 0.07 }); g7.arrows.play(); }, onBeat: g7Beat },
  { id: 'paper', label: 'The paper', beats: 1, scrolls: true, onEnter: () => { mountPaperFigures(); armHighlights(paper); } },
  { id: 'night', label: 'The night before', beats: act2.beats.length, dark: true, onBeat: nightBeat, onLeave: () => { nightLive?.destroy(); nightLive = null; } },
  { id: 'decade', label: 'Ten years later', beats: decadeBeats.length, onBeat: decadeBeat },
  { id: 'report', label: 'Report card', beats: 1, onEnter: () => armHighlights(report) },
  { id: 'end', label: 'Epilogue', beats: 1, dark: true, scrolls: true, onEnter: () => { mountEpilogue(); armHighlights(end); } },
];
createEngine(app, defs, panels);
