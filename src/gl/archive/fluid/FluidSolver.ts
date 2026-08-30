import * as THREE from "three";

import {
  ADVECTION_FRAGMENT,
  BASE_VERTEX,
  CLEAR_FRAGMENT,
  CURL_FRAGMENT,
  DIVERGENCE_FRAGMENT,
  GRADIENT_SUBTRACT_FRAGMENT,
  PRESSURE_FRAGMENT,
  SPLAT_FRAGMENT,
  VORTICITY_FRAGMENT,
} from "./shaders";

export type FluidOptions = {
  /** resolution of the velocity / pressure grid, on the short axis */
  simResolution: number;
  /** resolution of the visible dye field, on the short axis */
  dyeResolution: number;
  /** Jacobi iterations for the pressure projection */
  pressureIterations: number;
  /** how much pressure survives each frame (0..1); lower = stiffer */
  pressureDecay: number;
  /** dye fade rate per second */
  densityDissipation: number;
  /** velocity fade rate per second */
  velocityDissipation: number;
  /** vorticity confinement strength — the "aliveness" of the eddies */
  curl: number;
};

export const DEFAULT_FLUID_OPTIONS: FluidOptions = {
  simResolution: 128,
  dyeResolution: 512,
  pressureIterations: 20,
  pressureDecay: 0.8,
  densityDissipation: 1.45,
  velocityDissipation: 0.28,
  curl: 30,
};

type Resolution = { width: number; height: number };

/** Fit `resolution` to the short axis while preserving `aspect`. */
function resolutionFor(resolution: number, aspect: number): Resolution {
  const ratio = aspect >= 1 ? aspect : 1 / aspect;
  const min = Math.max(2, Math.round(resolution));
  const max = Math.max(2, Math.round(resolution * ratio));
  return aspect >= 1
    ? { width: max, height: min }
    : { width: min, height: max };
}

class PingPong {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;

  constructor(
    public width: number,
    public height: number,
    options: THREE.RenderTargetOptions,
  ) {
    this.read = new THREE.WebGLRenderTarget(width, height, options);
    this.write = new THREE.WebGLRenderTarget(width, height, options);
  }

  swap(): void {
    const temp = this.read;
    this.read = this.write;
    this.write = temp;
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
  }
}

/**
 * A GPU implementation of Stam's Stable Fluids, written against a plain
 * `THREE.WebGLRenderer` so it can be unit-reasoned about and reused outside of
 * react-three-fiber. It owns its own scene, camera and quad; the host only has
 * to call `step()` once a frame and read `dyeTexture`.
 */
export class FluidSolver {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly geometry = new THREE.PlaneGeometry(2, 2);

  private readonly materials: {
    advection: THREE.ShaderMaterial;
    splat: THREE.ShaderMaterial;
    curl: THREE.ShaderMaterial;
    vorticity: THREE.ShaderMaterial;
    divergence: THREE.ShaderMaterial;
    clear: THREE.ShaderMaterial;
    pressure: THREE.ShaderMaterial;
    gradientSubtract: THREE.ShaderMaterial;
  };

  private velocity!: PingPong;
  private dye!: PingPong;
  private pressure!: PingPong;
  private curlTarget!: THREE.WebGLRenderTarget;
  private divergenceTarget!: THREE.WebGLRenderTarget;

  private readonly dyeTexel = new THREE.Vector2();
  private options: FluidOptions;
  private aspect = 1;
  private readonly textureType: THREE.TextureDataType;

  constructor(
    renderer: THREE.WebGLRenderer,
    options: Partial<FluidOptions> = {},
  ) {
    this.renderer = renderer;
    this.options = { ...DEFAULT_FLUID_OPTIONS, ...options };

    // Half-float render targets need EXT_color_buffer_float on WebGL2. Without
    // it we still run, just with 8-bit fields — visibly banded but not broken.
    const hasFloatTargets = Boolean(
      renderer.getContext().getExtension("EXT_color_buffer_float"),
    );
    this.textureType = hasFloatTargets
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;

    const baseUniforms = () => ({
      uTexelSize: { value: new THREE.Vector2() },
    });

    const make = (
      fragmentShader: string,
      uniforms: Record<string, THREE.IUniform>,
    ) =>
      new THREE.ShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader,
        uniforms: { ...baseUniforms(), ...uniforms },
        depthTest: false,
        depthWrite: false,
      });

    this.materials = {
      advection: make(ADVECTION_FRAGMENT, {
        uVelocity: { value: null },
        uSource: { value: null },
        uDt: { value: 0 },
        uDissipation: { value: 0 },
      }),
      splat: make(SPLAT_FRAGMENT, {
        uTarget: { value: null },
        uAspectRatio: { value: 1 },
        uColor: { value: new THREE.Vector3() },
        uPoint: { value: new THREE.Vector2() },
        uRadius: { value: 0.0001 },
      }),
      curl: make(CURL_FRAGMENT, { uVelocity: { value: null } }),
      vorticity: make(VORTICITY_FRAGMENT, {
        uVelocity: { value: null },
        uCurl: { value: null },
        uCurlStrength: { value: 0 },
        uDt: { value: 0 },
      }),
      divergence: make(DIVERGENCE_FRAGMENT, { uVelocity: { value: null } }),
      clear: make(CLEAR_FRAGMENT, {
        uTexture: { value: null },
        uValue: { value: 1 },
      }),
      pressure: make(PRESSURE_FRAGMENT, {
        uPressure: { value: null },
        uDivergence: { value: null },
      }),
      gradientSubtract: make(GRADIENT_SUBTRACT_FRAGMENT, {
        uPressure: { value: null },
        uVelocity: { value: null },
      }),
    };

    this.quad = new THREE.Mesh(this.geometry, this.materials.clear);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    this.allocate();
  }

  /** The visible field. Feed this to whatever material renders the hero. */
  get dyeTexture(): THREE.Texture {
    return this.dye.read.texture;
  }

  get velocityTexture(): THREE.Texture {
    return this.velocity.read.texture;
  }

  /** Texel size of the dye grid, for neighbour sampling in the display pass. */
  get dyeTexelSize(): THREE.Vector2 {
    return this.dyeTexel.set(1 / this.dye.width, 1 / this.dye.height);
  }

  private targetOptions(): THREE.RenderTargetOptions {
    return {
      type: this.textureType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
      colorSpace: THREE.NoColorSpace,
    };
  }

  /**
   * (Re)create every field.
   *
   * On a resize the simulation must not visibly restart, so the previous
   * velocity and dye are resampled into the new grids before the old targets
   * are released. Pressure, curl and divergence are recomputed from scratch
   * each frame and are simply dropped.
   */
  private allocate(preserve = false): void {
    const previous = preserve
      ? { velocity: this.velocity, dye: this.dye }
      : null;
    if (preserve) {
      this.pressure.dispose();
      this.curlTarget.dispose();
      this.divergenceTarget.dispose();
    }

    const options = this.targetOptions();
    const sim = resolutionFor(this.options.simResolution, this.aspect);
    const dye = resolutionFor(this.options.dyeResolution, this.aspect);

    this.velocity = new PingPong(sim.width, sim.height, options);
    this.pressure = new PingPong(sim.width, sim.height, options);
    this.dye = new PingPong(dye.width, dye.height, options);
    this.curlTarget = new THREE.WebGLRenderTarget(
      sim.width,
      sim.height,
      options,
    );
    this.divergenceTarget = new THREE.WebGLRenderTarget(
      sim.width,
      sim.height,
      options,
    );

    if (previous) {
      this.copyInto(previous.velocity.read.texture, this.velocity);
      this.copyInto(previous.dye.read.texture, this.dye);
      previous.velocity.dispose();
      previous.dye.dispose();
    }
  }

  /** Resample `source` into the read buffer of `target` via the clear pass. */
  private copyInto(source: THREE.Texture, target: PingPong): void {
    const material = this.materials.clear;
    this.setTexel(material, target);
    material.uniforms.uTexture.value = source;
    material.uniforms.uValue.value = 1;
    this.blit(material, target.write);
    target.swap();
  }

  private blit(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null,
  ): void {
    this.quad.material = material;
    const previousTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(previousTarget);
  }

  private setTexel(material: THREE.ShaderMaterial, grid: PingPong): void {
    const texel = material.uniforms.uTexelSize.value as THREE.Vector2;
    texel.set(1 / grid.width, 1 / grid.height);
  }

  /** Call whenever the canvas aspect ratio changes. */
  setAspect(aspect: number): void {
    const next = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    if (Math.abs(next - this.aspect) < 0.001) return;
    this.aspect = next;
    this.allocate(true);
  }

  /** Apply a new quality budget without recreating the solver. */
  setOptions(options: Partial<FluidOptions>): void {
    const needsRealloc =
      (options.simResolution !== undefined &&
        options.simResolution !== this.options.simResolution) ||
      (options.dyeResolution !== undefined &&
        options.dyeResolution !== this.options.dyeResolution);

    this.options = { ...this.options, ...options };

    if (needsRealloc) {
      this.allocate(true);
    }
  }

  /**
   * Inject dye and momentum at a point.
   *
   * @param x   0..1 across the canvas, origin left
   * @param y   0..1 up the canvas, origin bottom
   * @param dx  horizontal impulse, in grid cells
   * @param dy  vertical impulse, in grid cells
   * @param color dye colour to deposit
   * @param radius splat radius in normalised units
   */
  splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: THREE.Vector3,
    radius = 0.0025,
  ): void {
    const material = this.materials.splat;
    const uniforms = material.uniforms;

    (uniforms.uPoint.value as THREE.Vector2).set(x, y);
    uniforms.uAspectRatio.value = this.aspect;
    uniforms.uRadius.value = correctRadius(radius, this.aspect);

    // velocity field
    this.setTexel(material, this.velocity);
    uniforms.uTarget.value = this.velocity.read.texture;
    (uniforms.uColor.value as THREE.Vector3).set(dx, dy, 0);
    this.blit(material, this.velocity.write);
    this.velocity.swap();

    // dye field
    this.setTexel(material, this.dye);
    uniforms.uTarget.value = this.dye.read.texture;
    (uniforms.uColor.value as THREE.Vector3).copy(color);
    this.blit(material, this.dye.write);
    this.dye.swap();
  }

  /** Advance the simulation by `dt` seconds. */
  step(dt: number): void {
    const { materials, velocity, pressure, dye, options } = this;

    // --- vorticity confinement -------------------------------------------
    this.setTexel(materials.curl, velocity);
    materials.curl.uniforms.uVelocity.value = velocity.read.texture;
    this.blit(materials.curl, this.curlTarget);

    this.setTexel(materials.vorticity, velocity);
    materials.vorticity.uniforms.uVelocity.value = velocity.read.texture;
    materials.vorticity.uniforms.uCurl.value = this.curlTarget.texture;
    materials.vorticity.uniforms.uCurlStrength.value = options.curl;
    materials.vorticity.uniforms.uDt.value = dt;
    this.blit(materials.vorticity, velocity.write);
    velocity.swap();

    // --- pressure projection ---------------------------------------------
    this.setTexel(materials.divergence, velocity);
    materials.divergence.uniforms.uVelocity.value = velocity.read.texture;
    this.blit(materials.divergence, this.divergenceTarget);

    this.setTexel(materials.clear, pressure);
    materials.clear.uniforms.uTexture.value = pressure.read.texture;
    materials.clear.uniforms.uValue.value = options.pressureDecay;
    this.blit(materials.clear, pressure.write);
    pressure.swap();

    this.setTexel(materials.pressure, pressure);
    materials.pressure.uniforms.uDivergence.value =
      this.divergenceTarget.texture;
    for (let i = 0; i < options.pressureIterations; i += 1) {
      materials.pressure.uniforms.uPressure.value = pressure.read.texture;
      this.blit(materials.pressure, pressure.write);
      pressure.swap();
    }

    this.setTexel(materials.gradientSubtract, velocity);
    materials.gradientSubtract.uniforms.uPressure.value =
      pressure.read.texture;
    materials.gradientSubtract.uniforms.uVelocity.value =
      velocity.read.texture;
    this.blit(materials.gradientSubtract, velocity.write);
    velocity.swap();

    // --- advection --------------------------------------------------------
    // Velocity is stored in grid cells per second, so the backtrace always
    // converts through the *velocity* texel size, dye resolution notwithstanding.
    this.setTexel(materials.advection, velocity);
    materials.advection.uniforms.uDt.value = dt;

    materials.advection.uniforms.uVelocity.value = velocity.read.texture;
    materials.advection.uniforms.uSource.value = velocity.read.texture;
    materials.advection.uniforms.uDissipation.value =
      options.velocityDissipation;
    this.blit(materials.advection, velocity.write);
    velocity.swap();

    materials.advection.uniforms.uVelocity.value = velocity.read.texture;
    materials.advection.uniforms.uSource.value = dye.read.texture;
    materials.advection.uniforms.uDissipation.value =
      options.densityDissipation;
    this.blit(materials.advection, dye.write);
    dye.swap();
  }

  dispose(): void {
    this.velocity.dispose();
    this.pressure.dispose();
    this.dye.dispose();
    this.curlTarget.dispose();
    this.divergenceTarget.dispose();
    this.geometry.dispose();
    Object.values(this.materials).forEach((material) => material.dispose());
  }
}

/** Keep splats circular on non-square canvases. */
function correctRadius(radius: number, aspect: number): number {
  return aspect > 1 ? radius * aspect : radius;
}
