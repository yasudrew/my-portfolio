/**
 * GPU quality tiering.
 *
 * Everything expensive on this site (fluid solver resolution, particle count,
 * post-processing chain) reads its budget from here rather than hard-coding a
 * number that only happens to work on the machine it was written on.
 *
 * The tier can be forced with `?q=low|mid|high` for testing — see PLAN.
 */

export type QualityTier = "low" | "mid" | "high";

export type QualityBudget = {
  tier: QualityTier;
  /** device pixel ratio cap for the main canvas */
  dpr: number;
  /** fluid simulation grid resolution (velocity/pressure fields) */
  simResolution: number;
  /** fluid dye resolution — the visible one, can exceed simResolution */
  dyeResolution: number;
  /** jacobi iterations for the pressure solve */
  pressureIterations: number;
  /** number of GPU particles in the morph scenes */
  particleCount: number;
  /** whether to run the bloom / chromatic aberration chain */
  postProcessing: boolean;
};

const BUDGETS: Record<QualityTier, Omit<QualityBudget, "tier">> = {
  low: {
    dpr: 1,
    simResolution: 96,
    dyeResolution: 256,
    pressureIterations: 12,
    particleCount: 32_768,
    postProcessing: false,
  },
  mid: {
    dpr: 1.5,
    simResolution: 128,
    dyeResolution: 512,
    pressureIterations: 20,
    particleCount: 131_072,
    postProcessing: true,
  },
  high: {
    dpr: 2,
    simResolution: 192,
    dyeResolution: 1024,
    pressureIterations: 28,
    particleCount: 262_144,
    postProcessing: true,
  },
};

export function budgetFor(tier: QualityTier): QualityBudget {
  return { tier, ...BUDGETS[tier] };
}

/** GPU model substrings that are reliably too slow for the high tier. */
const WEAK_GPU_PATTERNS = [
  "swiftshader",
  "llvmpipe",
  "software",
  "microsoft basic render",
  "intel(r) hd graphics",
  "intel(r) uhd graphics 6",
  "mali-4",
  "mali-t",
  "adreno (tm) 3",
  "adreno (tm) 4",
  "adreno (tm) 5",
  "powervr sgx",
];

function readRenderer(): string {
  if (typeof document === "undefined") return "";
  let canvas: HTMLCanvasElement | null = document.createElement("canvas");
  try {
    const gl =
      canvas.getContext("webgl2") ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const raw: unknown = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    // Drop the context eagerly; we only needed it for the identity string.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return typeof raw === "string" ? raw.toLowerCase() : "";
  } catch {
    return "";
  } finally {
    canvas = null;
  }
}

function forcedTier(): QualityTier | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("q");
  return q === "low" || q === "mid" || q === "high" ? q : null;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let webgl2Support: boolean | null = null;

/**
 * Whether this browser can give us a WebGL2 context at all.
 *
 * Cached because the probe allocates a canvas and the answer cannot change
 * for the life of the page. Read on every render through
 * `useSyncExternalStore`, so it has to be cheap and stable.
 */
export function hasWebGL2(): boolean {
  if (webgl2Support !== null) return webgl2Support;
  if (typeof document === "undefined") return false;
  try {
    webgl2Support = Boolean(
      document.createElement("canvas").getContext("webgl2"),
    );
  } catch {
    webgl2Support = false;
  }
  return webgl2Support;
}

/**
 * Best-effort synchronous tier detection. Deliberately pessimistic: an
 * over-estimated tier produces a janky first impression, an under-estimated one
 * only produces a slightly softer image that `escalate` can lift later.
 */
export function detectQualityTier(): QualityTier {
  const forced = forcedTier();
  if (forced) return forced;

  if (typeof window === "undefined") return "mid";
  if (!hasWebGL2()) return "low";

  const renderer = readRenderer();
  if (WEAK_GPU_PATTERNS.some((pattern) => renderer.includes(pattern))) {
    return "low";
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory ===
    "number"
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory!
      : 8;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 640;

  if (cores <= 4 || memory <= 4) return "low";
  if (coarsePointer || smallViewport) return "mid";
  if (cores >= 8 && memory >= 8) return "high";
  return "mid";
}

/** True when the URL pinned a tier, so runtime degradation must not override it. */
export function isTierPinned(): boolean {
  return forcedTier() !== null;
}

const DEMOTE: Record<QualityTier, QualityTier> = {
  high: "mid",
  mid: "low",
  low: "low",
};

export function demote(tier: QualityTier): QualityTier {
  return DEMOTE[tier];
}
