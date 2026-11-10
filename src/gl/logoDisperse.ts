/**
 * Hand-off between the DOM logo and its particle double.
 *
 * The lockup on the first screen is a real `<img>` — it has to be, for alt
 * text and for the browser's own image handling. The particles are WebGL. So
 * the two layers need to agree on exactly where the logo sits on screen, and on
 * which of them is showing it at any moment.
 *
 * Two things can hand the logo to the particles:
 * - a click takes it apart and puts it back together (`playLogo`)
 * - a pointer over it pushes the dots aside (`hoverLogo`)
 * The Lab demo fires a one-way dispersal at a box of its own
 * (`triggerDisperseAt`), with no DOM logo involved.
 *
 * This is a plain mutable singleton rather than React state on purpose: the GL
 * scene reads it inside its frame callback, and routing a per-frame value
 * through React would mean a re-render for something React never renders. The
 * one value the DOM does render from — whether the particles currently own the
 * logo — is exposed as a tiny external store for `useSyncExternalStore`.
 */

type Rect = { x: number; y: number; width: number; height: number };

export type DisperseState = {
  /** true from the trigger until the particles are done */
  active: boolean;
  /** seconds elapsed since the trigger */
  elapsed: number;
  /** the logo's box in CSS pixels relative to the viewport */
  rect: Rect;
  /** one-way (the Lab) or apart and back together (the home logo) */
  roundTrip: boolean;
  /**
   * The element whose box the particles follow every frame, so the logo can
   * scroll mid-flight. Null when the box was named directly.
   */
  target: HTMLElement | null;
};

/** How long the dispersal runs, in seconds. */
export const DISPERSE_DURATION = 0.95;
/** A round trip: how long the dots hang apart, then how long they take to return. */
export const ROUND_TRIP_HOLD = 0.3;
export const ROUND_TRIP_RETURN = 1.2;

export const disperseState: DisperseState = {
  active: false,
  elapsed: 0,
  rect: { x: 0, y: 0, width: 0, height: 0 },
  roundTrip: false,
  target: null,
};

/** The pointer over the logo, in CSS pixels relative to the viewport. */
export const hoverState = { active: false, x: 0, y: 0 };

/**
 * Fire a one-way dispersal at an arbitrary box.
 *
 * The Lab demo has no logo element — it is showing what the effect does, not
 * undoing anything — so it names a box directly.
 */
export function triggerDisperseAt(rect: Rect): void {
  disperseState.rect = rect;
  disperseState.elapsed = 0;
  disperseState.roundTrip = false;
  disperseState.target = null;
  disperseState.active = true;
}

export function resetDisperse(): void {
  disperseState.active = false;
  disperseState.elapsed = 0;
}

/** Progress of the dispersal at `elapsed` seconds, 0 (whole) to 1 (gone). */
export function disperseProgress(elapsed: number, roundTrip: boolean): number {
  const out = Math.min(1, elapsed / DISPERSE_DURATION);
  if (!roundTrip || elapsed < DISPERSE_DURATION) return out;
  const back = elapsed - DISPERSE_DURATION - ROUND_TRIP_HOLD;
  if (back <= 0) return 1;
  return Math.max(0, 1 - back / ROUND_TRIP_RETURN);
}

export function disperseDone(elapsed: number, roundTrip: boolean): boolean {
  const total = roundTrip
    ? DISPERSE_DURATION + ROUND_TRIP_HOLD + ROUND_TRIP_RETURN
    : DISPERSE_DURATION;
  return elapsed >= total;
}

// --- who owns the logo --------------------------------------------------------

/** Set by the GL scene once the logo has been sampled and can be drawn. */
let ready = false;
/** True while the particles, not the `<img>`, are showing the logo. */
let live = false;
const listeners = new Set<() => void>();

export function setLogoReady(value: boolean): void {
  ready = value;
}

export function subscribeLogoLive(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLogoLive(): boolean {
  return live;
}

/**
 * Only the GL scene turns this off, once the dots are back in place and still:
 * the `<img>` must not reappear while the particles are still visibly moving.
 */
export function setLogoLive(value: boolean): void {
  if (live === value) return;
  live = value;
  listeners.forEach((listener) => listener());
}

/** Take the logo apart and put it back together. Ignored while one is running. */
export function playLogo(element: HTMLElement): boolean {
  if (!ready || disperseState.active) return false;
  disperseState.target = element;
  disperseState.roundTrip = true;
  disperseState.elapsed = 0;
  disperseState.active = true;
  setLogoLive(true);
  return true;
}

/** The pointer is over the logo at (x, y). */
export function hoverLogo(element: HTMLElement, x: number, y: number): void {
  if (!ready) return;
  hoverState.active = true;
  hoverState.x = x;
  hoverState.y = y;
  if (!disperseState.active) disperseState.target = element;
  setLogoLive(true);
}

export function leaveLogo(): void {
  hoverState.active = false;
}

/** The logo element is going away: stop following it. */
export function releaseLogo(element: HTMLElement): void {
  hoverState.active = false;
  if (disperseState.target !== element) return;
  disperseState.target = null;
  if (disperseState.roundTrip) resetDisperse();
}
