"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { getStudioEnvironment } from "@/gl/env/studioEnvironment";
import { advanceFade, isDormant, type Fade } from "@/gl/scenes/lab/fade";
import { glsl } from "@/gl/shaders/glsl";
import { SIMPLEX_NOISE_3D } from "@/gl/shaders/simplexNoise";
import { frameState } from "@/lib/state/frame";
import { useLabPreview } from "@/lib/state/labPreview";
import { useAppStore } from "@/lib/state/store";
import type { QualityTier } from "@/lib/quality/detect";

/** Subdivision level of the icosphere per quality tier. */
const DETAIL: Record<QualityTier, number> = { low: 18, mid: 28, high: 40 };

/** Idle spin, radians per second. Slow enough to read as drift, not rotation. */
const SPIN_SPEED = 0.085;
/** How far the object leans toward the pointer, in radians. */
const TILT_X = 0.2;
const TILT_Y = 0.28;
/** Seconds-ish smoothing constants for the pointer follow. */
const TILT_DAMPING = 2.2;
const ENERGY_DAMPING = 1.6;

const VERTEX_HEADER = glsl`
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uFrequency;
  uniform float uEnergy;

  ${SIMPLEX_NOISE_3D}

  // Two octaves only: a large slow swell with one subtle secondary fold. More
  // octaves read as crumpled foil rather than a settled, heavy surface.
  float fbm(vec3 p) {
    return 0.78 * snoise(p)
         + 0.22 * snoise(p * 1.9);
  }

  vec3 displacePosition(vec3 p, vec3 n) {
    float t = uTime * 0.11;
    float d = fbm(p * uFrequency + vec3(0.0, t, t * 0.6));
    return p + n * d * uAmplitude * (1.0 + uEnergy);
  }

  // Any vertex displacement invalidates the authored normals. Rebuilding them
  // from two displaced neighbours in the tangent plane is what keeps the
  // highlights sitting on the surface instead of sliding across it.
  vec3 orthogonal(vec3 v) {
    return normalize(
      abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y)
    );
  }

  vec3 displacedNormal(vec3 p, vec3 n) {
    float eps = 0.012;
    vec3 tangent = orthogonal(n);
    vec3 bitangent = normalize(cross(n, tangent));

    vec3 p0 = displacePosition(p, n);
    vec3 p1 = displacePosition(p + tangent * eps, normalize(n + tangent * eps));
    vec3 p2 = displacePosition(p + bitangent * eps, normalize(n + bitangent * eps));

    vec3 result = normalize(cross(p1 - p0, p2 - p0));
    return dot(result, n) < 0.0 ? -result : result;
  }
`;

const GROUND = new THREE.Vector3(0.031, 0.043, 0.102);

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
    gl_FragColor = vec4(uGround * (1.0 - dot(v, v) * 0.6), uOpacity);
  }
`;

/**
 * The first title card, kept as a Lab preview.
 *
 * An icosphere pushed around by two octaves of simplex noise, lit entirely by
 * an environment map built in-process. The normals are rebuilt from two
 * displaced neighbours every frame, which is the only reason the highlights
 * stay on the surface instead of sliding across it.
 *
 * It is also the one preview that is real geometry rather than a full-screen
 * quad, which is why the canvas carries a depth buffer at all.
 */
export function HeroObject() {
  const gl = useThree((state) => state.gl);
  const viewport = useThree((state) => state.viewport);

  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const active = useLabPreview((state) => state.active);
  const visible = active === "hero-object";
  const fade = useRef<Fade>({ opacity: 0 });

  const tiltGroup = useRef<THREE.Group>(null);
  const spinGroup = useRef<THREE.Group>(null);

  const envMap = useMemo(() => getStudioEnvironment(gl), [gl]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.042 },
      uFrequency: { value: 0.8 },
      uEnergy: { value: 0 },
    }),
    [],
  );

  const material = useMemo(() => {
    const instance = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xc2c9d4),
      metalness: 0.92,
      roughness: 0.3,
      envMapIntensity: 1.7,
      transparent: true,
      opacity: 0,
    });

    instance.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uAmplitude = uniforms.uAmplitude;
      shader.uniforms.uFrequency = uniforms.uFrequency;
      shader.uniforms.uEnergy = uniforms.uEnergy;

      shader.vertexShader = VERTEX_HEADER + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        "vec3 objectNormal = displacedNormal(position, normal);",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "vec3 transformed = displacePosition(position, normal);",
      );
    };
    // Distinguish this program from a stock MeshPhysicalMaterial in three's cache.
    instance.customProgramCacheKey = () => "hero-object-displaced";

    return instance;
  }, [uniforms]);

  useEffect(() => {
    material.envMap = envMap;
    material.needsUpdate = true;
  }, [material, envMap]);

  useEffect(() => () => material.dispose(), [material]);

  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1, DETAIL[quality]),
    [quality],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const scale = Math.min(viewport.width, viewport.height) * 0.26;

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
  useEffect(() => () => backdrop.dispose(), [backdrop]);

  const scratch = useRef({ energy: 0 });

  useFrame(() => {
    const { pointer, time } = frameState;
    const dt = Math.min(time.delta, 1 / 30);
    const s = scratch.current;

    const opacity = advanceFade(fade.current, visible, dt, reducedMotion);
    material.opacity = opacity;
    backdrop.uniforms.uOpacity.value = opacity;
    if (isDormant(fade.current, visible)) return;

    if (!reducedMotion) {
      uniforms.uTime.value = time.elapsed;

      // pointer speed feeds a little extra swell into the surface
      const targetEnergy = Math.min(0.75, pointer.speed * 1.2);
      s.energy += (targetEnergy - s.energy) * Math.min(1, ENERGY_DAMPING * dt);
      uniforms.uEnergy.value = s.energy;

      if (spinGroup.current) spinGroup.current.rotation.y += SPIN_SPEED * dt;

      if (tiltGroup.current) {
        const tilt = tiltGroup.current.rotation;
        const targetX = -pointer.ny * TILT_X;
        const targetY = pointer.nx * TILT_Y;
        const k = Math.min(1, TILT_DAMPING * dt);
        tilt.x += (targetX - tilt.x) * k;
        tilt.y += (targetY - tilt.y) * k;
      }
    }

  });

  return (
    <>
      <mesh frustumCulled={false} material={backdrop} renderOrder={1}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <ambientLight intensity={0.12} />
      {/* renderOrder has to sit on the mesh: three does not inherit it down a
          group, so with it on the wrapper the sphere drew before the backdrop
          and the backdrop painted over it */}
      <group ref={tiltGroup} scale={scale}>
        <group ref={spinGroup}>
          <mesh geometry={geometry} material={material} renderOrder={2} />
        </group>
      </group>
    </>
  );
}
