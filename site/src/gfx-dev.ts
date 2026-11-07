/** Dev page for src/gfx: every module on paper and on ink, with a progress slider and Play. Not part of the story. */
import '/src/styles/fonts.css';
import '/src/styles/tokens.css';
import {
  createArcs, createArrow, createArrows, createChecker, createCircle, createClock, createConfetti, createCounter, createCourt,
  createDiet, createDotField, createHighlight, createScoreboard, createWire,
  type GfxHandle, type ZoneShares,
} from './gfx';

const main = document.getElementById('dev')!;
/* ?only=court narrows to matching cells; ?ground=paper|ink picks one ground; ?p=0.5 presets progress; ?w=390 emulates a phone column. */
const q = new URLSearchParams(location.search);
const only = (q.get('only') ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const groundFilter = q.get('ground');
const preset = q.get('p');
const forcedWidth = Number(q.get('w'));
if (forcedWidth > 0) main.style.cssText = `width:${forcedWidth}px;grid-template-columns:1fr;padding:12px`;

interface Tool { label: string; run: () => void }
type Host = 'plain' | 'box' | 'center' | 'text';

function cell(title: string, ground: 'paper' | 'ink', host: Host, mount: (host: HTMLElement) => GfxHandle, tools: (h: GfxHandle) => Tool[] = () => []): void {
  if (only && !title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(only)) return;
  if (groundFilter && groundFilter !== ground) return;
  const el = document.createElement('section');
  el.className = 'dev-cell';
  el.dataset.ground = ground;
  const h2 = document.createElement('h2');
  h2.textContent = `${title} · ${ground}`;
  const toolbar = document.createElement('div');
  toolbar.className = 'dev-tools';
  const hostEl = document.createElement('div');
  hostEl.className = `dev-host${host === 'plain' ? '' : ` dev-host--${host}`}`;
  el.append(h2, toolbar, hostEl);
  main.appendChild(el);
  const handle = mount(hostEl);
  // Track the last numeric progress so Play can mirror it on the slider.
  let last = 0;
  const inner = handle.set;
  handle.set = (v: number) => { last = v; inner(v); };

  const range = document.createElement('input');
  range.type = 'range'; range.min = '0'; range.max = '1'; range.step = '0.001';
  range.setAttribute('aria-label', `${title} progress`);
  const out = document.createElement('output');
  const sync = (p: number): void => { range.value = String(p); out.value = p.toFixed(2); };
  range.addEventListener('input', () => { handle.pause(); handle.set(Number(range.value)); out.value = Number(range.value).toFixed(2); });
  const btn = (label: string, run: () => void): void => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', run);
    toolbar.appendChild(b);
  };
  let mirror = 0;
  const stopMirror = (): void => { if (mirror) cancelAnimationFrame(mirror); mirror = 0; };
  btn('Play', () => {
    handle.play();
    stopMirror();
    const started = performance.now();
    const tick = (): void => { sync(last); mirror = performance.now() - started < 10000 ? requestAnimationFrame(tick) : 0; };
    mirror = requestAnimationFrame(tick);
  });
  btn('Pause', () => { handle.pause(); stopMirror(); });
  btn('0', () => { handle.pause(); stopMirror(); handle.set(0); sync(0); });
  btn('1', () => { handle.pause(); stopMirror(); handle.set(1); sync(1); });
  for (const t of tools(handle)) btn(t.label, t.run);
  toolbar.append(range, out);
  const p0 = preset !== null ? Number(preset) : 0;
  handle.set(p0);
  sync(p0);
}

const Z2016: ZoneShares = { lt8: 36, m8_16: 16, m16_24: 20, p24: 28 };
const Z2025: ZoneShares = { lt8: 35, m8_16: 13, m16_24: 10, p24: 42 };
const grounds = ['paper', 'ink'] as const;

for (const ground of grounds) {
  cell('Court half', ground, 'plain', (h) => {
    const c = createCourt(h, { view: 'half', ground });
    c.zones(Z2025);
    const base = c.set;
    // Dev only: the slider also rides a corner three so the shot path is visible with the line reveal.
    c.set = (p) => { base(p); c.shot({ x: 3.5, y: 9 }, 6, p); };
    return c;
  }, (h) => [
    { label: 'Zones 2016', run: () => (h as ReturnType<typeof createCourt>).zones(Z2016) },
    { label: 'Zones 2025', run: () => (h as ReturnType<typeof createCourt>).zones(Z2025) },
    { label: 'Zones off', run: () => (h as ReturnType<typeof createCourt>).zones({ lt8: 0, m8_16: 0, m16_24: 0, p24: 0 }) },
    { label: 'Shot: top', run: () => (h as ReturnType<typeof createCourt>).shot({ x: 25, y: 31 }, 8, 1) },
    { label: 'Clear shot', run: () => (h as ReturnType<typeof createCourt>).clearShot() },
  ]);
  cell('Court full', ground, 'plain', (h) => {
    const c = createCourt(h, { view: 'full', ground });
    c.zones(Z2025);
    const base = c.set;
    c.set = (p) => { base(p); c.shot({ x: 40, y: 70 }, 6, p); };
    return c;
  });
  cell('Scoreboard', ground, 'plain', (h) => createScoreboard(h, { from: { home: 85, away: 87, clock: '2:00' }, to: { home: 89, away: 89, clock: '0:53' } }), (h) => [
    { label: '+3 home', run: () => { const s = (h as ReturnType<typeof createScoreboard>); s.set({ ...s.state, home: s.state.home + 3 }); } },
    { label: '+2 away', run: () => { const s = (h as ReturnType<typeof createScoreboard>); s.set({ ...s.state, away: s.state.away + 2 }); } },
    { label: 'Tick', run: () => { const s = (h as ReturnType<typeof createScoreboard>); const sec = Math.max(0, Number(s.state.clock.split(':')[0]) * 60 + Number(s.state.clock.split(':')[1]) - 1); s.set({ ...s.state, clock: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` }); } },
  ]);
  cell('Counter', ground, 'plain', (h) => createCounter(h, { from: 0, to: 402, suffix: ' threes', duration: 1400 }));
  cell('Counter decimals', ground, 'plain', (h) => createCounter(h, { from: 28.4, to: 42.1, decimals: 1, suffix: '%', duration: 1400 }));
  cell('Arcs 402', ground, 'plain', (h) => createArcs(h, { count: 402 }));
  cell('Arcs 12', ground, 'plain', (h) => createArcs(h, { count: 12 }));
  cell('Diet', ground, 'plain', (h) => createDiet(h, { from: Z2016, to: Z2025 }), (h) => [
    { label: '2016', run: () => (h as ReturnType<typeof createDiet>).set(Z2016) },
    { label: '2025', run: () => (h as ReturnType<typeof createDiet>).set(Z2025) },
  ]);
  cell('Confetti', ground, 'box', (h) => createConfetti(h));
  cell('Counter disc', ground, 'plain', (h) => createCounter(h, { from: 0, to: 3, suffix: '–1', duration: 900, disc: true }));
  cell('Clock default 4:39', ground, 'center', (h) => createClock(h));
  cell('Clock hold 0:53', ground, 'center', (h) => createClock(h, { from: 53, to: 53, duration: 1200 }));
  cell('Arrows converging', ground, 'box', (h) => {
    const dot = document.createElement('div');
    dot.style.cssText = 'position:absolute;left:72%;top:50%;width:56px;height:56px;margin:-28px;border-radius:50%;background:var(--sun)';
    h.appendChild(dot);
    return createArrows(h, [{ x: 0.05, y: 0.1 }, { x: 0.5, y: 0.04 }, { x: 0.97, y: 0.3 }, { x: 0.9, y: 0.95 }], { target: { x: 0.72, y: 0.5 }, color: ground === 'ink' ? 'chalk' : 'ink' });
  });
  cell('Arrow single', ground, 'box', (h) => createArrow(h, { from: { x: 0.1, y: 0.8 }, to: { x: 0.85, y: 0.25 }, curve: -0.2, color: 'blue' }));
  for (const shape of ['torus', 'sphere', 'cylinder', 'plane'] as const) {
    cell(`Wire ${shape}`, ground, 'center', (h) => createWire(h, { shape }));
  }
  cell('Highlight', ground, 'text', (h) => {
    const head = document.createElement('h2');
    head.style.cssText = 'margin:0;font:900 clamp(40px,7vw,72px)/0.95 var(--font-display);letter-spacing:-0.02em;text-transform:uppercase';
    head.append('The ', Object.assign(document.createElement('span'), { textContent: 'long range' }), ' game');
    h.appendChild(head);
    return createHighlight(head.querySelector('span')!, { color: 'sun' }) as unknown as GfxHandle;
  });
  cell('Circle', ground, 'text', (h) => {
    const num = document.createElement('span');
    num.style.cssText = 'display:inline-block;margin:24px 32px;font:900 clamp(56px,10vw,120px)/0.9 var(--font-display);letter-spacing:-0.02em';
    num.textContent = '402';
    h.appendChild(num);
    return createCircle(num, { color: ground === 'ink' ? 'sun' : 'blue' }) as unknown as GfxHandle;
  });
  cell('Dot field ltr', ground, 'box', (h) => createDotField(h, { from: 8, to: 0, direction: 'ltr' }));
  cell('Dot field ttb', ground, 'box', (h) => createDotField(h, { from: 2, to: 9, direction: 'ttb' }));
  cell('Checker', ground, 'plain', (h) => createChecker(h, { cells: 16, rows: 2 }));
}
