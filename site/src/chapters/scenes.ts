/** Chapter scene builders (DOM only). main.ts mounts graphics, charts and wires beats. */
import { parsePaper, renderPage } from '@/paper/paper';
import { act2, act3, backlash, epilogue, marginNotes, method, reportCard } from '@/story/copy';

const h = (html: string): HTMLElement => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild as HTMLElement; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export const plate = (name: string, alt = '', cls = '', sizes = '100vw', eager = false) =>
  `<img class="${cls}" src="/media/v3/${name}-1600.webp" srcset="/media/v3/${name}-800.webp 800w, /media/v3/${name}-1600.webp 1600w, /media/v3/${name}-2400.webp 2400w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
/** Ambient loop over a plate: muted, looping, no poster (the plate img sits underneath). */
export const loop = (name: string, cls = '') =>
  `<video class="loop ${cls}" data-loop muted loop playsinline preload="none" aria-hidden="true"><source src="/media/v3/loops/${name}-960.mp4" type="video/mp4" media="(max-width: 960px)"><source src="/media/v3/loops/${name}-1600.mp4" type="video/mp4"></video>`;
const sparkle = (x: string, y: string, size = 18) => `<span class="sparkle" style="left:${x};top:${y};width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 0c.6 7 5 11.4 12 12-7 .6-11.4 5-12 12-.6-7-5-11.4-12-12 7-.6 11.4-5 12-12z" fill="currentColor"/></svg></span>`;
const hl = (text: string) => `<span class="hl" data-hl><span>${esc(text)}</span></span>`;

/* 0 — cover */
export function buildCover(): HTMLElement {
  return h(`
  <section class="ch cover speckle">
    <div class="ch__grid">
      <div>
        <p class="kicker">A 2016 paper on the three-pointer, re-scored in 2026</p>
        <h1 class="display cover__title">The Long<br>Range Game<br>${hl('Revisited')}</h1>
        <p class="mono mono--block cover__pitch">In 2016 a college senior argued the three-pointer was taking over the NBA, twelve hours after the most prolific three-point team in history lost the Finals at home. Ten years later, the data says who was right.</p>
        <div class="cover__meta"><span>Sahil Shah</span><span>NBA.com shot-location data, 1996-97 to 2025-26</span><span>7 chapters, about 6 minutes</span></div>
        <p class="cover__hint" data-no-advance><img class="cutout cutout--hand" src="/media/v3/elements/hand-pointing-right.webp" alt="" width="120" height="120" decoding="async"> Tap anywhere, swipe, or press the arrow keys</p>
      </div>
      <figure class="cover__art" style="margin:0">
        ${plate('portrait-cover', 'Halftone cutout of a hand palming a basketball with a blue wireframe torus behind it', '', '(min-width: 900px) 40vw, 90vw', true)}
        ${sparkle('-6px', '8%')}${sparkle('96%', '62%', 14)}
      </figure>
    </div>
    <div class="checker" aria-hidden="true"></div>
  </section>`);
}

/* 1 — game 7 */
export function buildGame7(): HTMLElement {
  return h(`
  <section class="ch g7 speckle">
    <div class="ch__plate ch__plate--right ch__plate--fade">${plate('game7', '', '', '100vw')}${loop('game7')}</div>
    <div class="g7__arrows" id="g7-arrows" aria-hidden="true"></div>
    <div class="ch__grid">
      <div class="g7__stage">
        <p class="kicker" id="g7-kicker">June 19, 2016 · Oracle Arena · Game 7</p>
        <img class="cutout cutout--watch" src="/media/v3/elements/stopwatch.webp" alt="" width="160" height="160" loading="lazy" decoding="async">
        <p class="display g7__big" id="g7-score">89–89</p>
        <div class="g7__board" id="g7-board"></div>
        <div class="g7__cap" id="g7-cap"><p>Score tied. Fifty-three seconds left.</p></div>
      </div>
      <div class="g7__court" id="g7-court" aria-hidden="true"></div>
    </div>
  </section>`);
}

/* 2 — the paper (scrolls) */
export function buildPaper(): HTMLElement {
  const sec = h(`
  <section class="paperch speckle">
    <div class="paperch__head">
      <div>
        <p class="kicker">June 20, 2016</p>
        <h2 class="display">The morning after, a college senior turned ${hl('this')} in.</h2>
        <p>He argued the three-pointer was the future of basketball. Twelve hours earlier, the most prolific three-point team ever had lost the Finals at home. The text below is verbatim. The figures are live charts from the 2026 pipeline, clipped to the paper's range. Yellow notes are 2026.</p>
      </div>
      <figure class="paperch__plate frame" style="margin:0">${plate('paper', 'Halftone cutout of a clipboard with stapled pages and a pencil, a blue wireframe cylinder beside it', '', '(min-width: 900px) 45vw, 100vw')}${loop('paper')}<figcaption class="frame__cap">EXHIBIT A · THE PAPER</figcaption></figure>
    </div>
    <div class="paperch__body"></div>
  </section>`);
  const body = sec.querySelector('.paperch__body')!;
  for (const p of parsePaper()) {
    const el = renderPage(p, marginNotes);
    el.classList.add('sheet');
    if (p.id === 'cover') el.classList.add('cover-sheet');
    body.appendChild(el);
  }
  body.querySelectorAll<HTMLElement>('.fig-mount').forEach((m) => {
    const id = m.dataset.fig!;
    m.before(h(`<div class="fig-head"><span class="kicker">FIG. ${esc(id)} · DRAWN LIVE FROM THE 2026 PIPELINE</span>
      <div class="toggle" role="group" aria-label="Then or now view for figure ${esc(id)}">
        <button type="button" data-mode="then" aria-pressed="true">Then, 2016</button>
        <button type="button" data-mode="now" aria-pressed="false">Now, 2026</button>
      </div></div>`));
    m.after(h(`<p class="fig-then-note" data-for="${esc(id)}">Then keeps the original's range and its flaws, labeled.</p>`));
  });
  return sec;
}

/* 3 — the night before */
export function buildNight(): HTMLElement {
  return h(`
  <section class="ch night speckle">
    <div class="ch__plate ch__plate--right ch__plate--fade">${plate('night', '', '', '100vw')}${loop('night')}</div>
    <div class="ch__grid">
      <div class="night__cap" id="night-cap"><span class="kicker">${esc(act2.beats[0].kicker)}</span>${act2.beats[0].lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
      <div class="night__stage">
        <p class="display night__big" id="night-big">73–9</p>
        <div class="night__gfx" id="night-gfx" aria-hidden="true"></div>
      </div>
    </div>
  </section>`);
}

/* 4 — ten years later: one chart per beat */
export const decadeBeats = [
  { id: 'fig11', title: 'The line kept going', steps: act3.fig11.steps },
  { id: 'fig12', title: 'Volume, not accuracy', steps: act3.fig12.steps },
  { id: 'fig2', title: 'The midrange faded', steps: act3.fig2.steps },
  { id: 'fig3', title: 'The Curry test', steps: act3.fig3.steps },
];
export const fig3Controls = `
  <label>Seasons through <input type="range" id="fig3-range" min="2016" max="2026" step="1" value="2016" aria-label="Last season included"> <output id="fig3-out">2016</output></label>
  <div class="toggle" role="group" aria-label="X axis">
    <button type="button" data-x="curry3pm" aria-pressed="true">Curry's makes per game</button>
    <button type="button" data-x="age" aria-pressed="false">Curry's age</button>
  </div>`;
export const fig12Controls = `
  <div class="toggle" role="group" aria-label="Factor">
    <button type="button" data-f="all" aria-pressed="true">All three</button>
    <button type="button" data-f="fg3m" aria-pressed="false">Makes</button>
    <button type="button" data-f="fg3a" aria-pressed="false">Attempts</button>
    <button type="button" data-f="fg3_pct" aria-pressed="false">Accuracy</button>
  </div>`;
export function buildDecade(): HTMLElement {
  return h(`
  <section class="ch decade speckle">
    <div class="ch__plate ch__plate--left ch__plate--fade-r">${plate('decade', '', '', '100vw')}${loop('decade')}</div>
    <div class="ch__grid">
      <div class="decade__side">
        <p class="kicker">Ten years later</p>
        <h2 class="display" id="decade-title">${esc(decadeBeats[0].title)}</h2>
        <ol class="decade__steps" id="decade-steps"></ol>
        <p class="mono" id="decade-foot">Same pipeline, same buckets, no splice.</p>
      </div>
      <div class="decade__panel frame graphic-card">
        <span class="sr-only" id="decade-cap">FIG. 1-1 · 1998–2026</span>
        ${decadeBeats.map((b) => `<div class="chart" id="decade-${b.id}" hidden></div>`).join('')}
        <div class="controls" id="decade-fig12-controls" hidden>${fig12Controls}</div>
        <div class="controls" id="decade-fig3-controls" hidden>${fig3Controls}</div>
      </div>
    </div>
  </section>`);
}

/* 5 — report card */
const verdictKey = (v: string) => v.startsWith('Held, then') ? 'accelerated' : v === 'Held' ? 'held' : v === 'Half right' ? 'half' : v === 'Not supported' ? 'not' : 'minor';
export function buildReport(): HTMLElement {
  return h(`
  <section class="ch report speckle">
    <div class="ch__plate ch__plate--left ch__plate--fade-r">${plate('report', '', '', '100vw')}${loop('report')}</div>
    <div class="ch__grid">
      <div class="report__side">
        <p class="kicker">The 2016 report card</p>
        <h2 class="display">Credit first. Then each correction gets ${hl('one sentence')}.</h2>
        <p class="mono mono--block" style="margin-top:1rem">The paper got the thesis right on the one day it looked most wrong, and its main chart matches a 2026 reconstruction within half a point.</p>
      </div>
      <div class="report__list" data-no-advance>
        ${reportCard.map((c, i) => `
        <article class="claim">
          <div>
            <p class="claim__text">${esc(c.claim)}</p>
            <p class="claim__evidence">${esc(c.evidence)}</p>
          </div>
          <button type="button" class="chip" data-v="${verdictKey(c.verdict)}" data-chart="${c.chart ?? ''}" data-i="${i}" ${c.chart ? '' : 'disabled'} aria-haspopup="${c.chart ? 'dialog' : 'false'}">${esc(c.verdict)}${c.chart ? ' · chart' : ''}</button>
        </article>`).join('')}
      </div>
    </div>
    <dialog class="evidence" id="evidence"><button type="button" class="btn close">Close</button><div class="chart" id="evidence-chart"></div></dialog>
  </section>`);
}

/* 6 — backlash, epilogue, method (scrolls, olive) */
export function buildEnd(): HTMLElement {
  return h(`
  <section class="endch speckle">
    <div class="wrap endch__plate frame">${plate('backlash', 'Six yellow discs in a row, four crossed out, two still glowing, hand-drawn on dark paper', '', '(min-width: 900px) 66rem, 100vw')}${loop('backlash')}<span class="frame__cap">FIG. B · 2024–2026</span></div>
    <div class="wrap">
      <div class="section-head">
        <p class="kicker">The backlash</p>
        <h2 class="display">Then the league asked if it had gone ${hl('too far')}.</h2>
      </div>
      <div class="quotes">
        ${backlash.map((q, i) => `
        <blockquote class="quote ${i === 0 ? 'quote--peak' : ''}">
          <span class="kicker">${esc(q.when)}<br>${esc(q.who)}</span>
          <div><p>${i === 0 ? q.quote.replace('37.6', hl('37.6')) : esc(q.quote)}</p><a href="${esc(q.url)}" rel="noopener" target="_blank">Source</a></div>
        </blockquote>`).join('')}
      </div>
    </div>
    <div class="wrap">
      <div class="section-head">
        <p class="kicker">Epilogue</p>
        <h2 class="display" id="epi-h">${esc(epilogue.title)}</h2>
      </div>
      <div class="epi__grid">
        <div class="epi__chart frame chart" id="epilogue-chart"><span class="frame__cap">FIG. E · 3PA PER GAME · 1997–2026</span></div>
        <div class="epi__lines">
          <figure class="frame epi__art" style="margin:0 0 1.2rem">${plate('epilogue', 'A blue wireframe arc rising across the frame with a halftone basketball at its peak', '', '(min-width: 900px) 30vw, 90vw')}${loop('epilogue')}<figcaption class="frame__cap">FIG. E · THE ARC</figcaption></figure>
          ${epilogue.lines.map((l) => `<p>${esc(l)}</p>`).join('')}
          <p><span class="stamp" id="data-stamp">Data through — · pulled —</span></p>
          <p class="mono">The weekly refresh job keeps this chart current. The page keeps grading the paper.</p>
        </div>
      </div>
      <p class="closing display" style="margin-top:3rem">${esc(epilogue.closing)}</p>
    </div>
    <div class="wrap">
      <div class="section-head"><p class="kicker">${esc(method.title)}</p></div>
      <div class="method__grid">
        ${['One pipeline', 'Every number traceable', 'Built with skills'].map((k, i) => `<div class="method__item"><h3>${k}</h3><p>${esc(method.lines[i])}</p></div>`).join('')}
      </div>
      <details class="data-notes"><summary>Data notes</summary><ul>${method.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></details>
      <footer class="footer">
        <span>The Long Range Game, Revisited. 2016 to 2026. Sahil Shah.</span>
        <span>No player likenesses, logos or league marks. Clock and score are public facts rendered as text.</span>
        <a href="${esc(method.repo)}" rel="noopener">Source repo</a>
      </footer>
    </div>
  </section>`);
}
