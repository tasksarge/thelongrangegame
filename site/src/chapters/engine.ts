/** Chapter engine: full-screen chapters with beats, hash routes (#c3-2), bar, arrows, keys, swipe. */

export interface ChapterDef {
  id: string;            // 'cover'
  label: string;         // 'Game 7'
  beats: number;         // >= 1
  dark?: boolean;
  /** called when the chapter becomes active or its beat changes */
  onBeat?: (beat: number, dir: 1 | -1 | 0) => void;
  onEnter?: () => void;
  onLeave?: () => void;
  /** chapters whose content scrolls internally (the paper) */
  scrolls?: boolean;
}

export interface Engine {
  go(chapter: number, beat?: number, dir?: 1 | -1 | 0): void;
  next(): void;
  prev(): void;
  current(): { chapter: number; beat: number };
  el: HTMLElement;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createEngine(root: HTMLElement, defs: ChapterDef[], panels: HTMLElement[]): Engine {
  let ci = 0, bi = 0, busy = false;
  const total = defs.length;

  /* ---- chrome ---- */
  const bar = document.createElement('nav');
  bar.className = 'chbar';
  bar.setAttribute('aria-label', 'Chapters');
  bar.innerHTML = `
    <a class="chbar__brand" href="#c0">The Long Range Game<span>Revisited</span></a>
    <ol class="chbar__list">${defs.map((d, i) => `<li><button type="button" class="chbar__item" data-i="${i}" aria-current="false"><span class="chbar__dot"></span><span class="chbar__label">${d.label}</span></button></li>`).join('')}</ol>
    <div class="chbar__beats" aria-hidden="true"></div>`;
  const ctrls = document.createElement('div');
  ctrls.className = 'chctl';
  ctrls.innerHTML = `
    <button type="button" class="chctl__btn chctl__prev" aria-label="Previous"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" class="chctl__btn chctl__next" aria-label="Next"><span class="chctl__nextlabel">Next</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  root.prepend(bar);
  root.append(ctrls);
  const items = Array.from(bar.querySelectorAll<HTMLButtonElement>('.chbar__item'));
  const beatsEl = bar.querySelector<HTMLElement>('.chbar__beats')!;
  const prevBtn = ctrls.querySelector<HTMLButtonElement>('.chctl__prev')!;
  const nextBtn = ctrls.querySelector<HTMLButtonElement>('.chctl__next')!;
  const nextLabel = ctrls.querySelector<HTMLElement>('.chctl__nextlabel')!;

  panels.forEach((p, i) => {
    p.classList.add('chapter');
    p.id = `c${i}`;
    p.setAttribute('role', 'region');
    p.setAttribute('aria-roledescription', 'chapter');
    p.setAttribute('aria-label', `${i + 1} of ${total}: ${defs[i].label}`);
    if (defs[i].dark) p.classList.add('scene--dark');
    if (defs[i].scrolls) p.classList.add('chapter--scrolls');
    p.hidden = i !== 0;
  });

  const paint = () => {
    items.forEach((b, i) => {
      b.setAttribute('aria-current', String(i === ci));
      b.classList.toggle('is-done', i < ci);
    });
    const n = defs[ci].beats;
    beatsEl.innerHTML = n > 1 ? Array.from({ length: n }, (_, k) => `<i class="${k <= bi ? 'on' : ''}"></i>`).join('') : '';
    prevBtn.disabled = ci === 0 && bi === 0;
    const last = ci === total - 1 && bi === defs[ci].beats - 1;
    nextBtn.disabled = last;
    nextLabel.textContent = bi < defs[ci].beats - 1 ? 'Next' : ci < total - 1 ? defs[ci + 1].label : 'End';
    document.documentElement.classList.toggle('is-dark-chapter', !!defs[ci].dark);
    document.documentElement.classList.toggle('is-scroll-chapter', !!defs[ci].scrolls);
    const hash = bi > 0 ? `#c${ci}-${bi}` : `#c${ci}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  };

  const loops = (panel: HTMLElement, on: boolean) => {
    panel.querySelectorAll<HTMLVideoElement>('video[data-loop]').forEach((v) => {
      if (on && !reduced()) { v.muted = true; v.defaultMuted = true; if (v.preload === 'none') v.preload = 'auto'; v.play().then(() => v.classList.add('is-playing')).catch(() => {}); }
      else v.pause();
    });
  };
  const show = (to: number, dir: 1 | -1 | 0) => {
    const from = panels[ci], target = panels[to];
    if (from === target) return Promise.resolve();
    loops(from, false); loops(target, true);
    busy = true;
    target.hidden = false;
    target.scrollTop = 0;
    if (reduced()) {
      from.hidden = true;
      busy = false;
      return Promise.resolve();
    }
    const dx = dir === 0 ? 0 : dir * 48;
    const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
    const dur = 260;
    const a1 = from.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-dx}px)` }], { duration: dur, easing: ease, fill: 'forwards' });
    const a2 = target.animate([{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: dur, easing: ease, fill: 'forwards' });
    return Promise.all([a1.finished, a2.finished]).then(() => {
      from.hidden = true;
      a1.cancel(); a2.cancel();
      busy = false;
    });
  };

  const go = (c: number, b = 0, dir: 1 | -1 | 0 = 0) => {
    c = Math.max(0, Math.min(total - 1, c));
    b = Math.max(0, Math.min(defs[c].beats - 1, b));
    if (busy) return;
    const chapterChange = c !== ci;
    if (chapterChange) {
      defs[ci].onLeave?.();
      const d: 1 | -1 | 0 = dir !== 0 ? dir : c > ci ? 1 : -1;
      show(c, d).then(() => { defs[c].onEnter?.(); defs[c].onBeat?.(b, d); });
      ci = c; bi = b;
    } else if (b !== bi) {
      const d: 1 | -1 | 0 = dir !== 0 ? dir : b > bi ? 1 : -1;
      bi = b;
      defs[c].onBeat?.(b, d);
    }
    paint();
  };
  const next = () => { if (bi < defs[ci].beats - 1) go(ci, bi + 1, 1); else go(ci + 1, 0, 1); };
  const prev = () => { if (bi > 0) go(ci, bi - 1, -1); else if (ci > 0) go(ci - 1, defs[ci - 1].beats - 1, -1); };

  /* ---- input ---- */
  items.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.i), 0)));
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement)?.closest('input, textarea, [contenteditable], dialog')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(total - 1);
  });
  // horizontal swipe (vertical scroll inside chapters stays native)
  let sx = 0, sy = 0, st = 0;
  root.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; st = performance.now(); }, { passive: true });
  root.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' || !st) return;
    const dx = e.clientX - sx, dy = e.clientY - sy, dt = performance.now() - st;
    st = 0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) { if (dx < 0) next(); else prev(); }
  }, { passive: true });
  // tapping the stage (not a control) advances inside beat-driven chapters
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('button, a, input, dialog, .chapter--scrolls, [data-no-advance], .chart, .graphic-card')) return;
    if (defs[ci].beats > 1) next();
  });
  addEventListener('hashchange', () => { const m = location.hash.match(/^#c(\d+)(?:-(\d+))?$/); if (m) go(Number(m[1]), Number(m[2] ?? 0)); });

  /* ---- boot from hash ---- */
  const m = location.hash.match(/^#c(\d+)(?:-(\d+))?$/);
  if (m) {
    const c = Math.max(0, Math.min(total - 1, Number(m[1])));
    panels[0].hidden = c !== 0;
    panels[c].hidden = false;
    ci = c; bi = Math.max(0, Math.min(defs[c].beats - 1, Number(m[2] ?? 0)));
  }
  paint();
  queueMicrotask(() => { defs[ci].onEnter?.(); defs[ci].onBeat?.(bi, 0); addEventListener('load', () => loops(panels[ci], true), { once: true }); if (document.readyState === 'complete') loops(panels[ci], true); });

  return { go, next, prev, current: () => ({ chapter: ci, beat: bi }), el: root };
}
