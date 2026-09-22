"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { glsl } from "@/gl/shaders/glsl";
import { advanceFade, isDormant, type Fade } from "@/gl/scenes/lab/fade";
import { frameState } from "@/lib/state/frame";
import { useLabPreview } from "@/lib/state/labPreview";
import { useAppStore } from "@/lib/state/store";

const COUNT = 22000;
/**
 * Euler steps integrated per particle, per frame.
 *
 * Too few and neighbouring particles diverge instead of tracking the same
 * streamline, which reads as scattered dots rather than as flow.
 */
const STEPS = 12;
/** Seconds a particle lives before it returns to its seed. */
const LIFETIME = 4.0;

const POINT_VERTEX = glsl`
  precision highp float;

  attribute vec2 aSeed;
  attribute float aPhase;
  attribute float aTint;

  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uDpr;

  varying float vLife;
  varying float vTint;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  /** Scalar potential. The flow is its perpendicular gradient, so it is
      divergence-free by construction — particles never pile up. */
  float potential(vec2 p) {
    // low frequencies on purpose: broad vortices are what a coarse integration
    // can still follow accurately, and what reads as a current rather than as
    // noise
    return noise(p * 0.9 + vec2(0.0, uTime * 0.05))
         + noise(p * 2.1 - vec2(uTime * 0.035, 0.0)) * 0.45;
  }

  vec2 curl(vec2 p) {
    const float e = 0.012;
    float dx = potential(p + vec2(e, 0.0)) - potential(p - vec2(e, 0.0));
    float dy = potential(p + vec2(0.0, e)) - potential(p - vec2(0.0, e));
    return vec2(dy, -dx) / (2.0 * e);
  }

  void main() {
    // Stateless on purpose: a particle's position is a pure function of its
    // seed and the clock, so there is no history buffer to keep, and pausing
    // the scene costs nothing to resume.
    float life = fract(aPhase + uTime / ${LIFETIME.toFixed(1)});
    vec2 p = aSeed;
    p.x *= uAspect;

    float travelled = life * ${LIFETIME.toFixed(1)};
    float dt = travelled / float(${STEPS});
    for (int i = 0; i < ${STEPS}; i++) {
      p += curl(p) * dt * 0.05;
    }

    // the cursor pushes the field outward around itself
    vec2 toPointer = p - vec2(uPointer.x * uAspect, uPointer.y);
    float push = exp(-dot(toPointer, toPointer) * 24.0);
    p += normalize(toPointer + 1e-4) * push * 0.09;

    vLife = life;
    vTint = aTint;

    vec2 clip = vec2(p.x / uAspect, p.y) * 2.0 - 1.0;
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = (1.1 + aTint * 1.5) * uDpr;
  }
`;

const POINT_FRAGMENT = glsl`
  precision highp float;

  varying float vLife;
  varying float vTint;

  uniform float uOpacity;
  uniform vec3 uCool;
  uniform vec3 uWarm;

  void main() {
    // fade in at birth and out at death so respawning is never a pop
    float envelope =
      smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.72, 1.0, vLife));
    vec3 color = mix(uCool, uWarm, pow(vTint, 2.0)) * 1.35;
    gl_FragColor = vec4(color * envelope * uOpacity, 1.0);
  }
`;

const BACKDROP_VERTEX = glsl`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BACKDROP_FRAGMENT = glsl`
  precision highp float;
  varying vec2 vUv;
  uniform float uOpacity;
  uniform vec3 uGround;
  void main() {
    vec2 v = vUv - 0.5;
    vec3 color = uGround * (1.0 - dot(v, v) * 0.55);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

/**
 * Seeded rather than `Math.random`, for two reasons: the buffer is built during
 * render, where an impure call is a bug waiting for a re-render to surface it,
 * and a fixed seed means the field looks the same on every visit instead of
 * being subtly different every time it is opened.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUND = new THREE.Vector3(0.031, 0.043, 0.102);
const COOL = new THREE.Vector3(0.36, 0.63, 1.0);
const WARM = new THREE.Vector3(0.96, 0.81, 0.31);

/**
 * Particles carried by a curl-noise field.
 *
 * The flow is the perpendicular gradient of a noise field rather than the
 * noise itself, which makes it divergence-free: there is nowhere for the
 * particles to collect, so the field stays evenly covered without anyone
 * having to redistribute it.
 *
 * Nothing is stored between frames. Each particle's position is recomputed
 * from its seed and the clock every frame, which costs more arithmetic than a
 * history buffer and buys the scene the ability to stop and start for free.
 */
export function CurlFlow() {
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const active = useLabPreview((state) => state.active);
  const visible = active === "curl-flow";

  const fade = useRef<Fade>({ opacity: 0 });
  const clock = useRef(0);

  const geometry = useMemo(() => {
    const seeds = new Float32Array(COUNT * 2);
    const phases = new Float32Array(COUNT);
    const tints = new Float32Array(COUNT);
    const positions = new Float32Array(COUNT * 3);

    const random = mulberry32(0x5eed);
    for (let i = 0; i < COUNT; i += 1) {
      seeds[i * 2] = random();
      seeds[i * 2 + 1] = random();
      phases[i] = random();
      tints[i] = random();
    }

    const g = new THREE.BufferGeometry();
    // the vertex shader writes clip space directly; position is only here
    // because three insists on it
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 2));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    return g;
  }, []);

  const points = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINT_VERTEX,
        fragmentShader: POINT_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uDpr: { value: 1 },
          uOpacity: { value: 0 },
          uCool: { value: COOL.clone() },
          uWarm: { value: WARM.clone() },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const backdrop = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BACKDROP_VERTEX,
        fragmentShader: BACKDROP_FRAGMENT,
        uniforms: {
          uOpacity: { value: 0 },
          uGround: { value: GROUND.clone() },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      points.dispose();
      backdrop.dispose();
    },
    [geometry, points, backdrop],
  );

  useFrame(() => {
    const { time, pointer } = frameState;
    const dt = Math.min(time.delta, 1 / 30);
    const opacity = advanceFade(fade.current, visible, dt, reducedMotion);

    points.uniforms.uOpacity.value = opacity;
    backdrop.uniforms.uOpacity.value = opacity;
    if (isDormant(fade.current, visible)) return;

    if (!reducedMotion) clock.current += dt;
    points.uniforms.uTime.value = clock.current;
    points.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    points.uniforms.uDpr.value = dpr;
    (points.uniforms.uPointer.value as THREE.Vector2).set(
      pointer.ux,
      1 - pointer.uy,
    );
  });

  return (
    <group renderOrder={1}>
      <mesh frustumCulled={false} material={backdrop} renderOrder={1}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <points
        frustumCulled={false}
        geometry={geometry}
        material={points}
        renderOrder={2}
      />
    </group>
  );
}
