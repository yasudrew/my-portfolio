/**
 * Hand-off between the DOM logo and its particle double.
 *
 * The lockup on the title card is a real `<img>` — it has to be, for alt text
 * and for the browser's own image handling. The dispersal is WebGL. So the two
 * layers need to agree on exactly where the logo sits on screen at the moment
 * of the click, and nothing else.
 *
 * This is a plain mutable singleton rather than React state on purpose: the GL
 * scene reads it inside its frame callback, and routing a per-frame trigger
 * through React would mean a re-render for a value React never renders.
 */

export type DisperseState = {
  /** true from the click until the particles have fully faded */
  active: boolean;
  /** seconds elapsed since the trigger */
  elapsed: number;
  /** the logo's box at trigger time, in CSS pixels relative to the viewport */
  rect: { x: number; y: number; width: number; height: number };
};

/** How long the dispersal runs, in seconds. */
export const DISPERSE_DURATION = 0.95;

export const disperseState: DisperseState = {
  active: false,
  elapsed: 0,
  rect: { x: 0, y: 0, width: 0, height: 0 },
};

export function triggerDisperse(element: HTMLElement): void {
  const box = element.getBoundingClientRect();
  disperseState.rect = {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
  disperseState.elapsed = 0;
  disperseState.active = true;
}

export function resetDisperse(): void {
  disperseState.active = false;
  disperseState.elapsed = 0;
}
