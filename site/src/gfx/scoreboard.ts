/**
 * createScoreboard: a flat ink panel with Home / Away numerals and a clock in display type.
 * set({ home, away, clock }) rolls each changed digit (200ms slide on a clipped column).
 * set(progress) interpolates between opts.from and opts.to so scroll can drive it.
 */
import './gfx.css';
import { createPlayer, htmlEl, lerp, prefersReducedMotion, type GfxHandle } from './motion';

export interface ScoreState { home: number; away: number; clock: string }
export interface ScoreboardOpts {
  from?: ScoreState;
  to?: ScoreState;
  /** play() duration in ms (default 1600). */
  duration?: number;
}
export interface ScoreboardHandle extends GfxHandle {
  set(value: number | ScoreState): void;
  readonly state: ScoreState;
}

interface Slot { el: HTMLElement; roll: HTMLElement; value: string; timer: number }

const ROLL_MS = 200;

export function parseClock(clock: string): number {
  const [m, s] = clock.split(':');
  return (Number(m) || 0) * 60 + (Number(s) || 0);
}
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createScoreboard(container: HTMLElement, opts: ScoreboardOpts = {}): ScoreboardHandle {
  const to: ScoreState = opts.to ?? { home: 0, away: 0, clock: '12:00' };
  const from: ScoreState = opts.from ?? to;
  let state: ScoreState = { ...from };

  const el = htmlEl('div', 'gfx gfx-scoreboard');
  el.setAttribute('role', 'img');
  const grid = htmlEl('div', 'gfx-scoreboard__grid', el);
  const home = htmlEl('div', 'gfx-scoreboard__team gfx-scoreboard__team--home', grid);
  htmlEl('span', 'gfx-scoreboard__label', home, 'Home');
  const homeNum = htmlEl('span', 'gfx-scoreboard__num', home);
  const clockWrap = htmlEl('div', 'gfx-scoreboard__clock', grid);
  const clockNum = htmlEl('span', 'gfx-scoreboard__num', clockWrap);
  const away = htmlEl('div', 'gfx-scoreboard__team gfx-scoreboard__team--away', grid);
  htmlEl('span', 'gfx-scoreboard__label', away, 'Away');
  const awayNum = htmlEl('span', 'gfx-scoreboard__num', away);

  const digit = (v: string): HTMLElement => htmlEl('span', 'gfx-scoreboard__digit', undefined, v);
  const makeSlot = (parent: HTMLElement, colon = false): Slot => {
    const slot = htmlEl('span', `gfx-scoreboard__slot${colon ? ' gfx-scoreboard__slot--colon' : ''}`, parent);
    const roll = htmlEl('span', 'gfx-scoreboard__roll', slot);
    roll.appendChild(digit(colon ? ':' : ''));
    if (!colon) slot.setAttribute('data-empty', '');
    return { el: slot, roll, value: colon ? ':' : '', timer: 0 };
  };
  const settle = (slot: Slot): void => {
    if (slot.timer) { clearTimeout(slot.timer); slot.timer = 0; }
    slot.roll.style.transition = 'none';
    slot.roll.replaceChildren(digit(slot.value));
    slot.roll.style.transform = 'translateY(0)';
    void slot.roll.offsetHeight;
    slot.roll.style.transition = '';
  };
  const rank = (v: string): number => (v === '' ? -1 : Number(v));
  const rollTo = (slot: Slot, next: string): void => {
    if (slot.value === next) return;
    settle(slot);
    if (next === '') slot.el.setAttribute('data-empty', ''); else slot.el.removeAttribute('data-empty');
    const up = rank(next) > rank(slot.value);
    if (prefersReducedMotion()) { slot.value = next; settle(slot); return; }
    const prev = slot.value;
    slot.roll.style.transition = 'none';
    slot.roll.replaceChildren(digit(up ? prev : next), digit(up ? next : prev));
    slot.roll.style.transform = up ? 'translateY(0)' : 'translateY(-1em)';
    void slot.roll.offsetHeight;
    slot.roll.style.transition = '';
    slot.roll.style.transform = up ? 'translateY(-1em)' : 'translateY(0)';
    slot.value = next;
    slot.timer = window.setTimeout(() => { slot.timer = 0; settle(slot); }, ROLL_MS + 40);
  };

  const homeSlots = [makeSlot(homeNum), makeSlot(homeNum), makeSlot(homeNum)];
  const awaySlots = [makeSlot(awayNum), makeSlot(awayNum), makeSlot(awayNum)];
  const clockSlots: Slot[] = [makeSlot(clockNum), makeSlot(clockNum), makeSlot(clockNum, true), makeSlot(clockNum), makeSlot(clockNum)];

  const setScore = (slots: Slot[], value: number): void => {
    const s = String(Math.max(0, Math.min(999, Math.round(value)))).padStart(3, ' ');
    slots.forEach((slot, i) => rollTo(slot, s[i] === ' ' ? '' : s[i]));
  };
  const setClock = (clock: string): void => {
    const [m, s] = clock.split(':');
    const mm = (m ?? '0').padStart(2, ' ');
    const ss = (s ?? '00').padStart(2, '0');
    const chars = [mm[0], mm[1], ':', ss[0], ss[1]];
    clockSlots.forEach((slot, i) => { if (i !== 2) rollTo(slot, chars[i] === ' ' ? '' : chars[i]); });
  };
  const render = (): void => {
    setScore(homeSlots, state.home);
    setScore(awaySlots, state.away);
    setClock(state.clock);
    el.setAttribute('aria-label', `Home ${Math.round(state.home)}, Away ${Math.round(state.away)}, ${state.clock} left`);
  };

  const player = createPlayer((p) => {
    state = {
      home: Math.round(lerp(from.home, to.home, p)),
      away: Math.round(lerp(from.away, to.away, p)),
      clock: formatClock(lerp(parseClock(from.clock), parseClock(to.clock), p)),
    };
    render();
  }, opts.duration ?? 1600);
  player.set(0);

  container.appendChild(el);
  return {
    el,
    play: player.play,
    pause: player.pause,
    set: (value) => {
      if (typeof value === 'number') { player.set(value); return; }
      player.pause();
      state = { ...value };
      render();
    },
    get state() { return state; },
    destroy: () => {
      player.destroy();
      for (const s of [...homeSlots, ...awaySlots, ...clockSlots]) if (s.timer) clearTimeout(s.timer);
      el.remove();
    },
  };
}
