import * as THREE from "three";

import { glsl } from "@/gl/shaders/glsl";

const BACKDROP_FRAGMENT = glsl`
  varying vec3 vWorldPosition;

  uniform vec3 uTop;
  uniform vec3 uBottom;

  void main() {
    float h = normalize(vWorldPosition).y * 0.5 + 0.5;
    gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(0.0, 1.0, h)), 1.0);
  }
`;

const BACKDROP_VERTEX = glsl`
  varying vec3 vWorldPosition;

  void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

type Panel = {
  position: [number, number, number];
  scale: [number, number];
  intensity: number;
  color: number;
};

/**
 * A three-light studio, softbox style: one large key from the upper right, a
 * weak fill from the lower left, and a cool rim from behind.
 */
const PANELS: readonly Panel[] = [
  { position: [4, 5, 4], scale: [9, 9], intensity: 7.5, color: 0xfff4e8 },
  { position: [-6, -1.5, 3], scale: [7, 10], intensity: 1.3, color: 0xb6ccff },
  { position: [-1.5, 2, -7], scale: [9, 6], intensity: 3.4, color: 0x93aef5 },
  // low rim: without it the underside melts into the background and the object
  // loses its silhouette against a near-black page
  { position: [0.5, -4.5, -3], scale: [8, 5], intensity: 2.0, color: 0x7f93c8 },
];

/**
 * Builds a prefiltered environment map in-process.
 *
 * A convincing metal needs something to reflect, and the usual answer is an
 * HDRI fetched from a CDN — a third-party request on the critical path, for an
 * asset the design never actually shows. Instead we render a tiny studio into a
 * cubemap and run it through PMREM once at startup: no network, no license to
 * carry, and the light rig stays editable in code.
 *
 * Prefer `getStudioEnvironment`, which caches per renderer.
 */
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const scene = new THREE.Scene();
  const disposables: Array<{ dispose: () => void }> = [];

  const backdropGeometry = new THREE.SphereGeometry(30, 32, 32);
  const backdropMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    uniforms: {
      uTop: { value: new THREE.Color(0x313a4d) },
      uBottom: { value: new THREE.Color(0x05060a) },
    },
  });
  scene.add(new THREE.Mesh(backdropGeometry, backdropMaterial));
  disposables.push(backdropGeometry, backdropMaterial);

  // Circular softboxes: a rectangular light reads as an obvious studio panel
  // in the reflection, a round one reads as a highlight.
  const panelGeometry = new THREE.CircleGeometry(0.5, 64);
  disposables.push(panelGeometry);

  for (const panel of PANELS) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(panel.color).multiplyScalar(panel.intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(panelGeometry, material);
    mesh.position.set(...panel.position);
    mesh.scale.set(panel.scale[0], panel.scale[1], 1);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(material);
  }

  // sigma > 0 blurs the source before prefiltering, which softens the edge of
  // each highlight instead of stamping the light's silhouette onto the metal
  const target = pmrem.fromScene(scene, 0.12);
  const texture = target.texture;

  pmrem.dispose();
  disposables.forEach((item) => item.dispose());

  return texture;
}

/**
 * One environment per renderer, built lazily and kept for the renderer's life.
 *
 * Deliberately never disposed by consumers. A PMREM result lives only in GPU
 * memory — its texture carries no `image` to re-upload from — so a component
 * unmount/remount cycle (React StrictMode does exactly this in development)
 * would release it and leave every metal surface black. The cache outlives
 * component lifecycles; the texture dies with the WebGL context.
 */
const CACHE = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function getStudioEnvironment(
  renderer: THREE.WebGLRenderer,
): THREE.Texture {
  const cached = CACHE.get(renderer);
  if (cached) return cached;

  const texture = createStudioEnvironment(renderer);
  CACHE.set(renderer, texture);
  return texture;
}
