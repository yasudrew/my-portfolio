/**
 * Bridge between the single application rAF loop and react-three-fiber.
 *
 * The canvas runs with `frameloop="never"`, so R3F never schedules its own
 * animation frame. Instead `SmoothScrollProvider` drives everything from one
 * GSAP ticker callback: Lenis first (so scroll values are settled), then
 * ScrollTrigger, then this. One loop means the DOM and the WebGL layer can
 * never disagree about what frame they are on.
 */

type AdvanceFn = (timestampMs: number) => void;

let advanceFn: AdvanceFn | null = null;

export function registerAdvance(fn: AdvanceFn): () => void {
  advanceFn = fn;
  return () => {
    if (advanceFn === fn) advanceFn = null;
  };
}

/** Render one WebGL frame. No-op until the canvas has mounted. */
export function advanceGL(timestampMs: number): void {
  advanceFn?.(timestampMs);
}

export function isGLDriven(): boolean {
  return advanceFn !== null;
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__glDriven = isGLDriven;
}
