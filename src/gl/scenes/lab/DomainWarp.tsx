"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { glsl } from "@/gl/shaders/glsl";
import { advanceFade, isDormant, type Fade } from "@/gl/scenes/lab/fade";
import { frameState } from "@/lib/state/frame";
import { useLabPreview } from "@/lib/state/labPreview";
import { useAppStore } from "@/lib/state/store";

const VERTEX = glsl`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Value noise rather than simplex: this shader calls it eighteen times per
 * pixel, and at that rate the cheaper one is the only one worth having.
 */
const FRAGMENT = glsl`
  precision highp float;

  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uDeep;
  uniform vec3 uLit;
  uniform vec3 uWarm;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += amp * noise(p);
      p *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * aspect * 3.0;

    // the whole idea: sample the field at a position that is itself the
    // output of the field. one pass gives billows, two gives filaments that
    // fold back into themselves
    vec2 q = vec2(fbm(p + uTime * 0.03), fbm(p + vec2(5.2, 1.3) - uTime * 0.02));
    vec2 r = vec2(
      fbm(p + 3.4 * q + vec2(1.7, 9.2) + uTime * 0.05),
      fbm(p + 3.4 * q + vec2(8.3, 2.8) - uTime * 0.04)
    );

    // the pointer bends the domain near the cursor instead of adding anything
    vec2 toPointer = (vUv - uPointer) * aspect;
    float pull = exp(-dot(toPointer, toPointer) * 6.0);
    r += normalize(toPointer + 1e-4) * pull * 0.55;

    float f = fbm(p + 3.8 * r);

    vec3 color = mix(uDeep, uLit, clamp(f * 2.1 - 0.15, 0.0, 1.0));
    color = mix(color, uWarm, clamp(length(r) * 0.72 - 0.16, 0.0, 1.0));
    // the warp field itself, drawn as a faint sheen on the folds
    color += uLit * pow(clamp(length(q) - 0.35, 0.0, 1.0), 2.0) * 0.5;

    vec2 v = vUv - 0.5;
    color *= 1.0 - dot(v, v) * 0.8;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

const DEEP = new THREE.Color("#0b1330");
const LIT = new THREE.Color("#4c7df6");
const WARM = new THREE.Color("#f5ce4e");

/**
 * Domain warping: fractal noise sampled through itself.
 *
 * One fragment pass and no buffers at all, which makes it the cheapest thing
 * in the Lab by a wide margin — and a deliberate counterweight to the fluid
 * sitting next to it. The fluid needs half a dozen render targets and a
 * pressure solve to look alive; this needs eighteen noise lookups.
 */
export function DomainWarp() {
  const size = useThree((state) => state.size);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const active = useLabPreview((state) => state.active);
  const visible = active === "domain-warp";

  const fade = useRef<Fade>({ opacity: 0 });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uDeep: { value: new THREE.Vector3(DEEP.r, DEEP.g, DEEP.b) },
          uLit: { value: new THREE.Vector3(LIT.r, LIT.g, LIT.b) },
          uWarm: { value: new THREE.Vector3(WARM.r, WARM.g, WARM.b) },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    const { time, pointer } = frameState;
    const dt = Math.min(time.delta, 1 / 30);
    const opacity = advanceFade(fade.current, visible, dt, reducedMotion);

    material.uniforms.uOpacity.value = opacity;
    if (isDormant(fade.current, visible)) return;

    (material.uniforms.uResolution.value as THREE.Vector2).set(
      size.width,
      size.height,
    );
    (material.uniforms.uPointer.value as THREE.Vector2).set(
      pointer.ux,
      1 - pointer.uy,
    );
    if (!reducedMotion) material.uniforms.uTime.value = time.elapsed;
  });

  return (
    <mesh frustumCulled={false} material={material} renderOrder={1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
