"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { FluidSolver } from "@/gl/fluid/FluidSolver";
import { DISPLAY_FRAGMENT } from "@/gl/fluid/displayShader";
import { BASE_VERTEX } from "@/gl/fluid/shaders";
import { budgetFor } from "@/lib/quality/detect";
import { frameState } from "@/lib/state/frame";
import { useLabPreview } from "@/lib/state/labPreview";
import { useAppStore } from "@/lib/state/store";

/** How hard a pointer movement pushes the velocity field. */
const POINTER_FORCE = 5200;
/** Seconds between ambient splats that keep the fluid alive when idle. */
const AMBIENT_INTERVAL = 0.45;

/**
 * Dye and velocity decay, overriding the solver's defaults.
 *
 * The defaults were tuned for a hero section, where a pointer is moving over
 * the canvas the whole time it is on screen. Here the fluid is a background
 * behind a page someone is reading, and the pointer may sit still for a
 * minute — at the original rate the screen is black within a few seconds of
 * the last movement. Slower decay means it keeps its shape while nothing is
 * happening.
 */
const DENSITY_DISSIPATION = 0.24;
const VELOCITY_DISSIPATION = 0.16;
/** Seconds to cross from the lattice to the fluid and back. */
const FADE_SECONDS = 0.42;

/** Straight from the dye palette the solver was written against. */
const PALETTE: readonly THREE.Vector3[] = [
  new THREE.Vector3(0.0, 0.85, 1.0), // cyan
  new THREE.Vector3(0.48, 0.36, 1.0), // violet
  new THREE.Vector3(1.0, 0.24, 0.51), // magenta
  new THREE.Vector3(0.0, 1.0, 0.64), // mint
  new THREE.Vector3(1.0, 0.71, 0.27), // amber
];

/** `--color-ground`, so a fully faded-in fluid sits on the page's own black. */
const BACKGROUND = new THREE.Vector3(0.031, 0.043, 0.102);

function paletteAt(t: number, out: THREE.Vector3): THREE.Vector3 {
  const scaled = (t % PALETTE.length) + PALETTE.length;
  const i = Math.floor(scaled) % PALETTE.length;
  const j = (i + 1) % PALETTE.length;
  return out.copy(PALETTE[i]).lerp(PALETTE[j], scaled - Math.floor(scaled));
}

/**
 * The Lab's fluid preview.
 *
 * Mounted while the Lab stage is open and invisible until the pointer settles
 * on the entry that owns it, then it crossfades over the lattice. Mounting
 * early is the point: the solver allocates its render targets up front, so the
 * hover itself costs nothing.
 *
 * It keeps simulating at zero opacity rather than freezing. A fluid that
 * resumes from the exact state it was paused in reads as a screenshot coming
 * back, not as something that was running the whole time.
 */
export function FluidField() {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const active = useLabPreview((state) => state.active);

  const solver = useMemo(() => {
    const budget = budgetFor(quality);
    return new FluidSolver(gl, {
      simResolution: budget.simResolution,
      dyeResolution: budget.dyeResolution,
      pressureIterations: budget.pressureIterations,
      densityDissipation: DENSITY_DISSIPATION,
      velocityDissipation: VELOCITY_DISSIPATION,
    });
    // quality changes are applied through setOptions below rather than by
    // rebuilding the solver, which would drop the field mid-fade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: DISPLAY_FRAGMENT,
        uniforms: {
          uTexelSize: { value: new THREE.Vector2(1 / 512, 1 / 512) },
          uTexture: { value: null },
          uBackground: { value: BACKGROUND.clone() },
          uTime: { value: 0 },
          uIntensity: { value: 0.9 },
          uIridescence: { value: 1 },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const scratch = useRef({
    color: new THREE.Vector3(),
    ambientTimer: 0,
    opacity: 0,
    seeded: false,
  });

  // Whatever was on screen has faded by the next time anyone looks, so each
  // reveal starts the field again rather than resuming an empty one.
  useEffect(() => {
    if (active !== "fluid-solver") scratch.current.seeded = false;
  }, [active]);

  useEffect(() => {
    const budget = budgetFor(quality);
    solver.setOptions({
      simResolution: budget.simResolution,
      dyeResolution: budget.dyeResolution,
      pressureIterations: budget.pressureIterations,
      densityDissipation: DENSITY_DISSIPATION,
      velocityDissipation: VELOCITY_DISSIPATION,
    });
  }, [quality, solver]);

  useEffect(() => {
    solver.setAspect(size.width / Math.max(1, size.height));
  }, [size.width, size.height, solver]);

  useEffect(() => () => solver.dispose(), [solver]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const s = scratch.current;
    const { pointer, time } = frameState;
    const dt = Math.min(time.delta, 1 / 30);

    const target = active === "fluid-solver" ? 1 : 0;
    // instant, not eased, when the visitor has asked for less motion
    s.opacity = reducedMotion
      ? target
      : s.opacity + (target - s.opacity) * Math.min(1, dt / FADE_SECONDS);
    if (Math.abs(target - s.opacity) < 0.002) s.opacity = target;

    material.uniforms.uOpacity.value = s.opacity;

    // nothing on screen and nothing fading — skip the whole simulation
    if (s.opacity <= 0.002 && target === 0) return;

    // Seeded on first reveal rather than on mount: dye injected while the
    // field is invisible has already dissipated by the time anyone looks.
    if (!s.seeded) {
      s.seeded = true;
      const SEEDS = 9;
      for (let i = 0; i < SEEDS; i += 1) {
        const angle = i * 2.399963; // golden angle
        const radius = 0.05 + (i / SEEDS) * 0.34;
        const push = 1500 * (1 - (i / SEEDS) * 0.55);
        solver.splat(
          0.5 + Math.cos(angle) * radius * 1.15,
          0.5 + Math.sin(angle) * radius,
          Math.cos(angle + 1.9) * push,
          Math.sin(angle + 1.9) * push,
          paletteAt(i * 0.85 + time.elapsed * 0.3, s.color).multiplyScalar(0.5),
          0.006 + i * 0.0018,
        );
      }
    }

    if (!reducedMotion) {
      if (pointer.active && (pointer.dx !== 0 || pointer.dy !== 0)) {
        solver.splat(
          pointer.ux,
          1 - pointer.uy,
          pointer.dx * POINTER_FORCE,
          -pointer.dy * POINTER_FORCE,
          paletteAt(time.elapsed * 0.35, s.color).multiplyScalar(
            pointer.down ? 0.42 : 0.2,
          ),
        );
      }

      s.ambientTimer += dt;
      if (s.ambientTimer >= AMBIENT_INTERVAL) {
        s.ambientTimer = 0;
        const t = time.elapsed;
        solver.splat(
          0.5 + Math.sin(t * 0.31) * 0.34 + Math.sin(t * 0.13) * 0.1,
          0.5 + Math.cos(t * 0.24) * 0.3 + Math.cos(t * 0.17) * 0.12,
          Math.cos(t * 0.7) * 700,
          Math.sin(t * 0.9) * 700,
          paletteAt(t * 0.11, s.color).multiplyScalar(0.3),
          0.009,
        );
      }

      solver.step(dt);
    }

    material.uniforms.uTexture.value = solver.dyeTexture;
    (material.uniforms.uTexelSize.value as THREE.Vector2).copy(
      solver.dyeTexelSize,
    );
    material.uniforms.uTime.value = time.elapsed;
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
