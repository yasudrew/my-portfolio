"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { glsl } from "@/gl/shaders/glsl";
import { STAGES } from "@/content/stages";
import { useConsoleStore } from "@/lib/state/console";
import { budgetFor } from "@/lib/quality/detect";
import { frameState } from "@/lib/state/frame";
import { useAppStore } from "@/lib/state/store";

const VERTEX = glsl`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * The background lattice.
 *
 * An ordered grid that yields toward the cursor and carries a soft horizontal
 * band of emphasis tracking the selected stage — the interface's structure,
 * restated behind it. Everything is drawn in one fragment pass, so the whole
 * background costs a single draw call.
 */
const FRAGMENT = glsl`
  precision highp float;

  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uPointer;      // 0..1, origin bottom-left
  uniform float uPointerIn;   // 0..1, fades the well in and out
  uniform float uTime;
  uniform float uBand;        // 0..1 down the screen, follows the selection
  uniform float uSpacing;     // px between lattice points
  uniform vec3 uBase;
  uniform vec3 uLit;

  void main() {
    vec2 px = vUv * uResolution;

    // radial well around the cursor
    vec2 toPointer = px - uPointer * uResolution;
    float dist = length(toPointer);
    float radius = min(uResolution.x, uResolution.y) * 0.42;
    float well = max(0.0, 1.0 - dist / radius);
    // cubed rather than squared: the falloff starts later and stays soft,
    // so the cursor suggests the lattice instead of shoving it
    well = well * well * well * uPointerIn;

    vec2 displaced = px + normalize(toPointer + vec2(1e-4)) * well * 5.0;

    // slow ambient drift so a still cursor is not a still image
    displaced.y += sin(uTime * 0.5 + displaced.x * 0.018) * 1.1;

    // band of emphasis on the selected row
    float band = 1.0 - clamp(abs(vUv.y - uBand) / 0.3, 0.0, 1.0);
    band = band * band;

    // one dot per lattice cell
    vec2 cell = fract(displaced / uSpacing) - 0.5;
    float toCentre = length(cell) * uSpacing;
    float size = 1.05 + band * 0.55 + well * 0.85;
    float dot = 1.0 - smoothstep(size - 0.9, size + 0.4, toCentre);

    float alpha = 0.075 + band * 0.26 + well * 0.22;
    vec3 color = mix(uBase, uLit, clamp(well * 2.0, 0.0, 1.0));

    float a = dot * min(0.8, alpha);
    // premultiplied so the dots add to the page behind rather than darkening it
    gl_FragColor = vec4(color * a, a);
  }
`;

export function LatticeField() {
  const size = useThree((state) => state.size);
  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const cursor = useConsoleStore((state) => state.cursor);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerIn: { value: 0 },
      uTime: { value: 0 },
      uBand: { value: 0.5 },
      uSpacing: { value: 44 },
      uBase: { value: new THREE.Color(0x4c7df6) },
      uLit: { value: new THREE.Color(0x7fb2ff) },
    }),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
    // tighter lattice on small screens so the pattern keeps its density
    uniforms.uSpacing.value = size.width < 640 ? 34 : 44;
  }, [size.width, size.height, uniforms]);

  // The lattice trails the cursor rather than tracking it: an instant response
  // reads as twitchy, a lagged one reads as weight.
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  // The band is the only part of the background that knows about the menu.
  const target = useRef(0.5);
  useEffect(() => {
    const t = STAGES.length > 1 ? cursor / (STAGES.length - 1) : 0.5;
    // shader UV is bottom-up, the menu reads top-down
    target.current = 1 - (0.28 + t * 0.44);
  }, [cursor]);

  useFrame(() => {
    const { pointer, time } = frameState;
    const dt = Math.min(time.delta, 1 / 30);

    if (!reducedMotion) uniforms.uTime.value = time.elapsed;

    uniforms.uBand.value += (target.current - uniforms.uBand.value) * Math.min(1, dt * 4);

    const wanted = pointer.active && !reducedMotion ? 1 : 0;
    uniforms.uPointerIn.value += (wanted - uniforms.uPointerIn.value) * Math.min(1, dt * 3);

    const follow = Math.min(1, dt * 2.6);
    smoothPointer.current.x += (pointer.ux - smoothPointer.current.x) * follow;
    smoothPointer.current.y += (1 - pointer.uy - smoothPointer.current.y) * follow;
    uniforms.uPointer.value.copy(smoothPointer.current);
  });

  // quality only affects DPR here, which the canvas owns; nothing to do per tier
  void budgetFor(quality);

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
