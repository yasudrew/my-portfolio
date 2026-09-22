/**
 * The crossfade every Lab preview shares.
 *
 * Each preview is a full-screen quad that has to appear over the lattice and
 * leave again without a cut. The rule is the same for all of them, so it lives
 * here rather than being copied into each scene: ease toward the target, snap
 * once the difference stops being visible, and jump straight there for anyone
 * who has asked for less motion.
 */

/** Seconds to cross from the lattice to a preview and back. */
export const FADE_SECONDS = 0.42;

/** Below this, a scene is invisible and can stop simulating. */
export const FADE_EPSILON = 0.002;

export type Fade = { opacity: number };

export function advanceFade(
  fade: Fade,
  visible: boolean,
  dt: number,
  reducedMotion: boolean,
): number {
  const target = visible ? 1 : 0;

  if (reducedMotion) {
    fade.opacity = target;
    return target;
  }

  fade.opacity += (target - fade.opacity) * Math.min(1, dt / FADE_SECONDS);
  if (Math.abs(target - fade.opacity) < FADE_EPSILON) fade.opacity = target;
  return fade.opacity;
}

/** True when there is nothing on screen and nothing on its way in. */
export function isDormant(fade: Fade, visible: boolean): boolean {
  return !visible && fade.opacity <= FADE_EPSILON;
}
