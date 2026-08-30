"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { FluidSolver } from "./fluid/FluidSolver";
import { DISPLAY_FRAGMENT } from "./fluid/displayShader";
import { BASE_VERTEX } from "./fluid/shaders";
import { budgetFor } from "@/lib/quality/detect";
import { frameState } from "@/lib/state/frame";
import { useAppStore } from "@/lib/state/store";

/** How hard a pointer movement pushes the velocity field. */
const POINTER_FORCE = 5200;
/** How hard scrolling shears the field. */
const SCROLL_FORCE = 900;
/** Seconds between ambient splats that keep the fluid alive when idle. */
const AMBIENT_INTERVAL = 0.9;

/** Palette shared with the CSS design tokens (--color-flow-*). */
const PALETTE: readonly THREE.Vector3[] = [
  new THREE.Vector3(0.0, 0.85, 1.0), // cyan
  new THREE.Vector3(0.48, 0.36, 1.0), // violet
  new THREE.Vector3(1.0, 0.24, 0.51), // magenta
  new THREE.Vector3(0.0, 1.0, 0.64), // mint
  new THREE.Vector3(1.0, 0.71, 0.27), // amber
];

const BACKGROUND = new THREE.Vector3(0.016, 0.02, 0.039);

/** Smoothly cycle the palette so consecutive splats stay related. */
function paletteAt(t: number, out: THREE.Vector3): THREE.Vector3 {
  const scaled = (t % PALETTE.length) + PALETTE.length;
  const i = Math.floor(scaled) % PALETTE.length;
  const j = (i + 1) % PALETTE.length;
  return out.copy(PALETTE[i]).lerp(PALETTE[j], scaled - Math.floor(scaled));
}

export function HeroFluid() {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const setReady = useAppStore((state) => state.setReady);

  const solver = useMemo(() => {
    const budget = budgetFor("mid");
    return new FluidSolver(gl, {
      simResolution: budget.simResolution,
      dyeResolution: budget.dyeResolution,
      pressureIterations: budget.pressureIterations,
    });
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
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const scratch = useRef({
    color: new THREE.Vector3(),
    ambientTimer: 0,
    seeded: false,
    frames: 0,
  });

  // quality budget -> solver options
  useEffect(() => {
    const budget = budgetFor(quality);
    solver.setOptions({
      simResolution: budget.simResolution,
      dyeResolution: budget.dyeResolution,
      pressureIterations: budget.pressureIterations,
    });
  }, [quality, solver]);

  useEffect(() => {
    solver.setAspect(size.width / Math.max(1, size.height));
  }, [size.width, size.height, solver]);

  useEffect(() => () => solver.dispose(), [solver]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const s = scratch.current;
    const { pointer, scroll, time } = frameState;
    const dt = Math.min(time.delta, 1 / 30);

    // --- seed: never open on an empty screen -----------------------------
    // Placed on the golden angle with a growing radius: evenly covered but
    // with no rotational symmetry, so the opening frame reads as an accident
    // of fluid rather than a pattern.
    if (!s.seeded) {
      s.seeded = true;
      const SEEDS = 9;
      for (let i = 0; i < SEEDS; i += 1) {
        const angle = i * 2.399963; // golden angle in radians
        const radius = 0.05 + (i / SEEDS) * 0.34;
        const push = 1500 * (1 - (i / SEEDS) * 0.55);
        solver.splat(
          0.5 + Math.cos(angle) * radius * 1.15,
          0.5 + Math.sin(angle) * radius,
          Math.cos(angle + 1.9) * push,
          Math.sin(angle + 1.9) * push,
          paletteAt(i * 0.85, s.color).multiplyScalar(0.34),
          0.006 + i * 0.0018,
        );
      }
    }

    if (!reducedMotion) {
      // --- pointer stirring ---------------------------------------------
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

      // --- scroll shear ---------------------------------------------------
      const shear = scroll.normalizedVelocity;
      if (Math.abs(shear) > 0.02) {
        solver.splat(
          0.5,
          scroll.direction > 0 ? 0.05 : 0.95,
          0,
          shear * SCROLL_FORCE,
          paletteAt(time.elapsed * 0.2 + 2, s.color).multiplyScalar(
            Math.min(0.22, Math.abs(shear) * 0.32),
          ),
          0.02,
        );
      }

      // --- ambient life ----------------------------------------------------
      s.ambientTimer += dt;
      if (s.ambientTimer >= AMBIENT_INTERVAL) {
        s.ambientTimer = 0;
        const t = time.elapsed;
        const x = 0.5 + Math.sin(t * 0.31) * 0.34 + Math.sin(t * 0.13) * 0.1;
        const y = 0.5 + Math.cos(t * 0.24) * 0.3 + Math.cos(t * 0.17) * 0.12;
        solver.splat(
          x,
          y,
          Math.cos(t * 0.7) * 700,
          Math.sin(t * 0.9) * 700,
          paletteAt(t * 0.11, s.color).multiplyScalar(0.15),
          0.006,
        );
      }

      solver.step(dt);
    }

    material.uniforms.uTexture.value = solver.dyeTexture;
    (material.uniforms.uTexelSize.value as THREE.Vector2).copy(
      solver.dyeTexelSize,
    );
    material.uniforms.uTime.value = time.elapsed;

    s.frames += 1;
    if (s.frames === 2) setReady(true);
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
