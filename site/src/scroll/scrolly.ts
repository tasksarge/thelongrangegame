/** Scroll engine: stepped text over a pinned graphic, per-scene progress, global progress bar. */

export interface ScrollyHandlers {
  onStep?: (index: number, el: HTMLElement) => void;
  onProgress?: (t: number) => void;
  onEnter?: () => void;
  onLeave?: () => void;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createScrolly(root: HTMLElement, h: ScrollyHandlers) {
  const steps = Array.from(root.querySelectorAll<HTMLElement>('.step'));
  let active = -1;
  let inside = false;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = steps.indexOf(e.target as HTMLElement);
        if (i === active) continue;
        steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
        active = i;
        h.onStep?.(i, steps[i]);
      }
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );
  steps.forEach((s) => io.observe(s));

  let ticking = false;
  const update = () => {
    ticking = false;
    const r = root.getBoundingClientRect();
    const vh = innerHeight;
    const span = Math.max(1, r.height - vh);
    const t = Math.max(0, Math.min(1, -r.top / span));
    const nowInside = r.top < vh && r.bottom > 0;
    if (nowInside !== inside) {
      inside = nowInside;
      (inside ? h.onEnter : h.onLeave)?.();
    }
    if (inside) h.onProgress?.(t);
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  return {
    steps,
    refresh: update,
    destroy() {
      io.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    },
  };
}

export interface ActMarker { id: string; el: HTMLElement; label: string }

export function createProgressBar(acts: ActMarker[]) {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<div class="progress__bar"></div><div class="progress__acts"></div>`;
  document.body.prepend(bar);
  const fill = bar.querySelector<HTMLElement>('.progress__bar')!;
  const marks = bar.querySelector<HTMLElement>('.progress__acts')!;

  const place = () => {
    const docH = document.documentElement.scrollHeight - innerHeight;
    marks.innerHTML = '';
    for (const a of acts) {
      const top = a.el.getBoundingClientRect().top + scrollY;
      const m = document.createElement('span');
      m.className = 'progress__act';
      m.style.left = `${(top / docH) * 100}%`;
      m.title = a.label;
      marks.appendChild(m);
    }
  };
  let ticking = false;
  const tick = () => {
    ticking = false;
    const docH = document.documentElement.scrollHeight - innerHeight;
    fill.style.width = `${(scrollY / Math.max(1, docH)) * 100}%`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  addEventListener('resize', place);
  // layout settles late (fonts, images)
  place(); tick();
  setTimeout(place, 800);
  addEventListener('load', place);
  return { refresh: place };
}

/** Add `cls` to matching elements when they enter the viewport. */
export function revealOnScroll(selector: string, cls = 'is-visible', rootMargin = '0px 0px -20% 0px') {
  const els = document.querySelectorAll<HTMLElement>(selector);
  if (reduced()) { els.forEach((e) => e.classList.add(cls)); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).classList.add(cls); io.unobserve(e.target); }
  }, { rootMargin, threshold: 0.1 });
  els.forEach((e) => io.observe(e));
}

/** Track which act is on screen and keep the hash in sync for deep links (#act-2). */
export function trackActs(acts: ActMarker[]) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = (e.target as HTMLElement).id;
      if (id && location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    }
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  acts.forEach((a) => io.observe(a.el));
}
