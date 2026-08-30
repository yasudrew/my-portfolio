import type * as THREE from "three";

/**
 * Module-level handle on the live renderer.
 *
 * react-three-fiber resets `renderer.info` at the top of every frame, so a
 * `useFrame` callback always reads zeroes. The debug HUD instead samples the
 * counters from outside the loop, between frames, where they hold the totals of
 * the frame that just went out.
 */
let current: THREE.WebGLRenderer | null = null;

export function setRenderer(renderer: THREE.WebGLRenderer | null): void {
  current = renderer;
}

export function getRenderer(): THREE.WebGLRenderer | null {
  return current;
}
