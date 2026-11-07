/** Code-drawn motion graphics for the story. Every factory returns { el, play, pause, set, destroy }. */
export { createCourt, type CourtOpts, type CourtHandle, type ZoneShares, type CourtPoint } from './court';
export { createScoreboard, parseClock, formatClock, type ScoreboardOpts, type ScoreboardHandle, type ScoreState } from './scoreboard';
export { createCounter, type CounterOpts, type CounterHandle } from './counter';
export { createArcs, type ArcsOpts, type ArcsHandle } from './arcs';
export { createDiet, type DietOpts, type DietHandle, type DietShares } from './diet';
export { createConfetti, type ConfettiOpts, type ConfettiHandle } from './confetti';
export { createClock, type ClockOpts, type ClockHandle } from './clock';
export { createArrow, createArrows, type ArrowOpts, type ArrowsOpts, type ArrowPoint, type ArrowColor } from './arrows';
export { createWire, type WireOpts, type WireShape, type WireHandle } from './wire';
export { createHighlight, createCircle, type HighlightOpts, type CircleOpts, type DecorHandle } from './highlight';
export { createDotField, createChecker, type DotFieldOpts, type CheckerOpts, type DotDirection } from './dots';
export { cubicBezier, easeOut, easeInOut, createPlayer, tween, prefersReducedMotion, type GfxHandle, type Easing, type Player } from './motion';
