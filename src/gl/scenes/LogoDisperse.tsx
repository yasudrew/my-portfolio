"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { glsl } from "@/gl/shaders/glsl";
import {
  DISPERSE_DURATION,
  disperseState,
  resetDisperse,
} from "@/gl/logoDisperse";
import { budgetFor, type QualityTier } from "@/lib/quality/detect";
import { frameState } from "@/lib/state/frame";
import { useAppStore } from "@/lib/state/store";

/** Sampling stride over the logo bitmap, in source pixels, per tier. */
const STRIDE: Record<QualityTier, number> = { low: 6, mid: 4, high: 3 };
/** Alpha below this is treated as empty space and produces no particle. */
const ALPHA_CUTOFF = 40;
/** How far a particle can drift, as a fraction of the logo's width. */
const SPREAD = 0.42;

const VERTEX = glsl`
  attribute vec2 aCell;      // 0..1 position within the logo
  attribute vec3 aColor;
  attribute vec3 aDrift;     // xy direction, z = per-particle speed 0..1

  uniform vec4 uRect;        // x, y, width, height in clip space
  uniform float uProgress;   // 0..1
  uniform float uSpread;
  uniform float uPixelRatio;
  uniform float uSize;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Each particle leaves on its own clock, so the lockup comes apart from
    // the edges inward instead of every dot moving as one block.
    float stagger = mix(0.0, 0.45, aDrift.z);
    float t = clamp((uProgress - stagger) / (1.0 - stagger), 0.0, 1.0);

    // ease-out: fast release, long settle
    float eased = 1.0 - pow(1.0 - t, 2.4);

    vec2 base = vec2(
      uRect.x + aCell.x * uRect.z,
      uRect.y - aCell.y * uRect.w
    );

    // drift outward, with a slight upward bias so it reads as dissipating
    // rather than falling apart
    vec2 offset = aDrift.xy * eased * uSpread;
    offset.y += eased * uSpread * 0.18;

    // a little lateral wander, phased per particle
    offset.x += sin(eased * 6.2831 + aDrift.z * 12.0) * uSpread * 0.05 * eased;

    gl_Position = vec4(base + offset, 0.0, 1.0);

    vColor = aColor;
    vAlpha = 1.0 - eased;
    gl_PointSize = uSize * uPixelRatio * (0.65 + (1.0 - eased) * 0.35);
  }
`;

const FRAGMENT = glsl`
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // round, soft-edged points — square dots read as pixelation, not molecules
    vec2 offset = gl_PointCoord - 0.5;
    float d = length(offset);
    float mask = 1.0 - smoothstep(0.34, 0.5, d);
    float a = vAlpha * mask;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

type Sampled = {
  cells: Float32Array;
  colors: Float32Array;
  drifts: Float32Array;
  count: number;
  aspect: number;
};

/**
 * Read the logo bitmap once and turn its opaque pixels into particles.
 *
 * Sampling on the client rather than shipping a pre-baked point cloud keeps the
 * source of truth as the single PNG the brand actually owns: replace the file
 * and the dispersal follows it.
 */
async function sampleLogo(src: string, stride: number): Promise<Sampled> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D context unavailable for logo sampling");
  ctx.drawImage(image, 0, 0);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const cells: number[] = [];
  const colors: number[] = [];
  const drifts: number[] = [];

  for (let y = 0; y < canvas.height; y += stride) {
    for (let x = 0; x < canvas.width; x += stride) {
      const i = (y * canvas.width + x) * 4;
      if (data[i + 3] < ALPHA_CUTOFF) continue;

      cells.push(x / canvas.width, y / canvas.height);
      colors.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);

      // direction biased away from the centre, so the mass opens outward
      const dx = x / canvas.width - 0.5;
      const dy = y / canvas.height - 0.5;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
      const reach = 0.35 + Math.random() * 0.65;
      drifts.push(Math.cos(angle) * reach, Math.sin(angle) * reach, Math.random());
    }
  }

  return {
    cells: new Float32Array(cells),
    colors: new Float32Array(colors),
    drifts: new Float32Array(drifts),
    count: cells.length / 2,
    aspect: canvas.width / canvas.height,
  };
}

export function LogoDisperse({ src }: { src: string }) {
  const size = useThree((state) => state.size);
  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  const [sampled, setSampled] = useState<Sampled | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sampleLogo(src, STRIDE[quality])
      .then((result) => {
        if (!cancelled) setSampled(result);
      })
      .catch(() => {
        // A failed sample only costs the effect; the DOM logo still hides and
        // the console still opens.
      });
    return () => {
      cancelled = true;
    };
  }, [src, quality]);

  const uniforms = useMemo(
    () => ({
      uRect: { value: new THREE.Vector4() },
      uProgress: { value: 0 },
      uSpread: { value: SPREAD },
      uPixelRatio: { value: 1 },
      uSize: { value: 2.2 },
    }),
    [],
  );

  const geometry = useMemo(() => {
    if (!sampled) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("aCell", new THREE.BufferAttribute(sampled.cells, 2));
    g.setAttribute("aColor", new THREE.BufferAttribute(sampled.colors, 3));
    g.setAttribute("aDrift", new THREE.BufferAttribute(sampled.drifts, 3));
    // position is unused by the shader but three expects the attribute to exist
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(sampled.count * 3), 3),
    );
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    return g;
  }, [sampled]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

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

  const dpr = budgetFor(quality).dpr;
  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(dpr, 2);
    // keep the dots just overlapping at the sampling stride
    uniforms.uSize.value = STRIDE[quality] * 0.9;
  }, [dpr, quality, uniforms]);

  const wasActive = useRef(false);

  useFrame(() => {
    if (!disperseState.active) {
      if (wasActive.current) {
        wasActive.current = false;
        setVisible(false);
      }
      return;
    }

    if (!wasActive.current) {
      wasActive.current = true;
      setVisible(true);
    }

    disperseState.elapsed += frameState.time.delta;
    const progress = reducedMotion
      ? 1
      : Math.min(1, disperseState.elapsed / DISPERSE_DURATION);
    uniforms.uProgress.value = progress;

    // CSS pixels -> clip space. The rect is captured at click time, so a resize
    // mid-flight is not worth chasing.
    const { rect } = disperseState;
    const w = Math.max(1, size.width);
    const h = Math.max(1, size.height);
    uniforms.uRect.value.set(
      (rect.x / w) * 2 - 1,
      1 - (rect.y / h) * 2,
      (rect.width / w) * 2,
      (rect.height / h) * 2,
    );

    if (progress >= 1) resetDisperse();
  });

  if (!geometry || !visible) return null;

  return <points frustumCulled={false} geometry={geometry} material={material} />;
}
