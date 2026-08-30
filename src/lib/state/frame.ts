/**
 * Per-frame mutable state.
 *
 * Scroll position, pointer position and time change every single frame. Routing
 * them through React (or even through a zustand subscription) would mean a
 * re-render per frame, which is exactly what we cannot afford next to a fluid
 * solver. So they live in one plain mutable object that both the DOM layer and
 * the WebGL layer read directly inside their own frame callbacks.
 *
 * Discrete state (quality tier, active scene, menu open) belongs in the zustand
 * store instead — see `./store.ts`.
 */

export type ScrollFrame = {
  /** smoothed scroll offset in px (Lenis output) */
  y: number;
  /** raw, unsmoothed scroll offset in px */
  rawY: number;
  /** px per frame, signed */
  velocity: number;
  /** velocity normalised to roughly -1..1 for shader consumption */
  normalizedVelocity: number;
  /** 0..1 over the whole document */
  progress: number;
  /** 1 = down, -1 = up */
  direction: number;
};

export type PointerFrame = {
  /** viewport px */
  x: number;
  y: number;
  /** normalised 0..1, origin top-left */
  ux: number;
  uy: number;
  /** normalised -1..1, origin centre (y up) */
  nx: number;
  ny: number;
  /** delta since last frame, in normalised units */
  dx: number;
  dy: number;
  /** movement magnitude, eased — useful as a generic "energy" uniform */
  speed: number;
  down: boolean;
  /** false until the user has actually moved a pointer (touch devices) */
  active: boolean;
};

export type TimeFrame = {
  /** seconds since the loop started */
  elapsed: number;
  /** seconds since the previous frame, clamped to avoid tab-switch explosions */
  delta: number;
};

export type FrameState = {
  scroll: ScrollFrame;
  pointer: PointerFrame;
  time: TimeFrame;
  /** measured frames per second, updated ~4x/sec */
  fps: number;
};

export const frameState: FrameState = {
  scroll: {
    y: 0,
    rawY: 0,
    velocity: 0,
    normalizedVelocity: 0,
    progress: 0,
    direction: 1,
  },
  pointer: {
    x: 0,
    y: 0,
    ux: 0.5,
    uy: 0.5,
    nx: 0,
    ny: 0,
    dx: 0,
    dy: 0,
    speed: 0,
    down: false,
    active: false,
  },
  time: { elapsed: 0, delta: 0 },
  fps: 60,
};

/** Largest delta we are willing to integrate, in seconds (~5fps). */
export const MAX_DELTA = 1 / 5;

/**
 * Development escape hatch: expose the live frame state on `window` so it can
 * be inspected from the console (or from a browser-driving agent) without
 * threading a reference through React.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__frameState = frameState;
}
