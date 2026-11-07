/** Dev page: mounts every chart in both modes with buttons for each method. Not part of the story. */
import {
  createFig11, createFig12, createFig2, createFig3, createEpilogue,
  league as realLeague, shots as realShots, curry as realCurry, dataComplete,
  type ChartHandle, type Mode, type Factor, type XVar,
} from './charts';
import { fixtureLeague, fixtureShots, fixtureCurry } from './charts/fixture';

const main = document.getElementById('dev')!;
/* ?real=1 forces the committed data even when the pull is partial (to check empty/partial states). */
const useReal = dataComplete || new URLSearchParams(location.search).get('real') === '1';
/* ?trunc=1999 keeps only seasons ending ≤ that year, to check the partial-data and empty states. */
const trunc = Number(new URLSearchParams(location.search).get('trunc')) || Infinity;
const cut = <T extends { season: string }>(rows: T[]) => rows.filter((r) => Number(r.season.slice(0, 4)) + 1 <= trunc);
const league = cut(useReal ? realLeague : fixtureLeague);
const shots = cut(useReal ? realShots : fixtureShots);
const curry = cut(useReal ? realCurry : fixtureCurry);
if (!useReal) {
  const warn = document.createElement('p');
  warn.textContent = `FIXTURE DATA: data/*.json is missing or partial (${realLeague.length} league seasons, ${realShots.length} bucket rows, ${realCurry.length} Curry seasons), so these charts draw src/charts/fixture.ts (not real numbers).`;
  warn.style.cssText = 'margin:12px 24px 0;padding:8px 12px;border:3px solid var(--pen);color:var(--pen);font:700 12px/1.4 var(--font-mono)';
  main.before(warn);
}

interface Tool { label: string; run: () => void; pressed?: () => boolean }

/* ?only=fig3 narrows to matching cells; ?dark=0|1 picks one paper; ?p=0.5 presets progress. */
const q = new URLSearchParams(location.search);
const only = (q.get('only') ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const darkFilter = q.get('dark');
const preset = q.get('p');
const forcedWidth = Number(q.get('w'));
if (forcedWidth > 0) {
  // Emulate a phone column (headless Chrome will not open a window narrower than ~500px).
  main.style.cssText = `width:${forcedWidth}px;grid-template-columns:1fr;padding:12px`;
}

/* ?navy=1 previews the dark cells on the navy ground the story is moving to (dev-only token override). */
const navy = q.get('navy') === '1';

function cell(title: string, dark: boolean, mount: (host: HTMLElement) => ChartHandle, tools: (h: ChartHandle) => Tool[] = () => []): void {
  if (only && !title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(only)) return;
  if (darkFilter !== null && dark !== (darkFilter === '1')) return;
  const el = document.createElement('section');
  el.className = `dev-cell${dark ? ' scene--dark' : ''}`;
  if (dark) el.setAttribute('data-ground', 'ink'); // the story's dark chapters use this attribute
  if (dark && navy) el.style.cssText = '--bg:#0F1B2D;--bg-2:#172540;--fg:#F3E9D2;--fg-muted:#B9B3A5;--accent:#FF8A3D;--grey:#6F7A8C;--grey-2:#3C4A61;--accent-2:#7FB3FF';
  const h2 = document.createElement('h2');
  h2.textContent = title + (dark ? ' · dark' : ' · cream');
  const toolbar = document.createElement('div');
  toolbar.className = 'dev-tools';
  const host = document.createElement('div');
  host.className = 'chart'; // the story shell passes a container that already carries this class
  const alt = document.createElement('p');
  alt.className = 'dev-alt';
  el.append(h2, toolbar, host, alt);
  main.appendChild(el);
  const handle = mount(host);
  const refreshAlt = () => (alt.textContent = `alt: ${handle.alt()}`);
  const buttons: { b: HTMLButtonElement; t: Tool }[] = [];
  const sync = () => {
    for (const { b, t } of buttons) if (t.pressed) b.setAttribute('aria-pressed', String(t.pressed()));
    refreshAlt();
  };
  const all: Tool[] = [
    { label: 'Then', run: () => handle.setMode('then') },
    { label: 'Now', run: () => handle.setMode('now') },
    ...tools(handle),
  ];
  for (const t of all) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.label;
    b.addEventListener('click', () => {
      t.run();
      sync();
    });
    toolbar.appendChild(b);
    buttons.push({ b, t });
  }
  const lab = document.createElement('label');
  lab.textContent = 'progress ';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = '1';
  range.step = '0.01';
  range.value = '0';
  range.addEventListener('input', () => {
    handle.setProgress(Number(range.value));
    refreshAlt();
  });
  lab.appendChild(range);
  toolbar.appendChild(lab);
  if (preset !== null) {
    range.value = preset;
    handle.setProgress(Number(preset));
  }
  refreshAlt();
}

for (const dark of [false, true]) {
  for (const mode of ['then', 'now'] as Mode[]) {
    cell(`Fig 1-1 · ${mode}`, dark, (host) => createFig11(host, { shots, league }, { mode }), (h) => {
      let on = false;
      const f = h as ReturnType<typeof createFig11>;
      return [{ label: 'overlay 3PA rate', run: () => f.setOverlay((on = !on)), pressed: () => on }];
    });
  }
  for (const mode of ['then', 'now'] as Mode[]) {
    cell(`Fig 1-2 · ${mode}`, dark, (host) => createFig12(host, league, { mode }), (h) => {
      const f = h as ReturnType<typeof createFig12>;
      let cur: Factor = 'all';
      return (['fg3m', 'fg3a', 'fg3_pct', 'all'] as Factor[]).map((k) => ({
        label: k,
        run: () => f.setFactor((cur = k)),
        pressed: () => cur === k,
      }));
    });
  }
  for (const mode of ['then', 'now'] as Mode[]) {
    cell(`Fig 2 · ${mode}`, dark, (host) => createFig2(host, shots, { mode }));
  }
  for (const mode of ['then', 'now'] as Mode[]) {
    cell(`Fig 3 · ${mode}`, dark, (host) => createFig3(host, { curry, shots }, { mode }), (h) => {
      const f = h as ReturnType<typeof createFig3>;
      let xv: XVar = 'curry3pm';
      return [
        { label: 'x: Curry 3PM', run: () => f.setX((xv = 'curry3pm')), pressed: () => xv === 'curry3pm' },
        { label: 'x: age', run: () => f.setX((xv = 'age')), pressed: () => xv === 'age' },
        { label: 'paper 7', run: () => f.setSeasons([2010, 2011, 2012, 2013, 2014, 2015, 2016]) },
        { label: 'all seasons', run: () => f.setSeasons(f.available()) },
        { label: '+ next season', run: () => { const s = f.seasons(); const next = f.available().find((y) => y > (s[s.length - 1] ?? 0)); if (next) f.setSeasons([...s, next]); } },
        { label: '− last season', run: () => f.setSeasons(f.seasons().slice(0, -1)) },
      ];
    });
  }
  cell('Epilogue', dark, (host) => createEpilogue(host, league, { mode: 'now' }));
}
