"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Canvas, useThree } from "@react-three/fiber";

import { registerAdvance } from "@/gl/frameloop";
import { setRenderer } from "@/gl/renderer";
import { FluidField } from "@/gl/scenes/FluidField";
import { CurlFlow } from "@/gl/scenes/lab/CurlFlow";
import { HeroObject } from "@/gl/scenes/lab/HeroObject";
import { DomainWarp } from "@/gl/scenes/lab/DomainWarp";
import { LatticeField } from "@/gl/scenes/LatticeField";
import { LogoDisperse } from "@/gl/scenes/LogoDisperse";
import { budgetFor, hasWebGL2 } from "@/lib/quality/detect";
import { useLabPreview } from "@/lib/state/labPreview";
import { useAppStore } from "@/lib/state/store";

/**
 * Hands R3F's `advance` to the application loop.
 *
 * The canvas runs `frameloop="never"`, so it only renders when
 * `FrameLoopProvider` tells it to — one rAF for the whole site.
 */
function FrameDriver() {
  const advance = useThree((state) => state.advance);
  useEffect(() => registerAdvance(advance), [advance]);
  return null;
}

/**
 * The persistent canvas.
 *
 * Mounted once in the root layout and never unmounted, so navigating between
 * stages never tears down a WebGL context. Decoration only — `aria-hidden`, and
 * everything it expresses is also present in the DOM above it.
 */
/** The probe's answer never changes, so there is nothing to subscribe to. */
function subscribeNever(): () => void {
  return () => {};
}

export function GLCanvas() {
  /**
   * Skip the canvas entirely where WebGL cannot run.
   *
   * Without this, three throws while creating its context and the console
   * fills with errors on any machine with a blacklisted GPU, WebGL disabled,
   * or aggressive power saving. The background is decoration — every piece of
   * information it carries is in the DOM above it — so the right response to
   * "no WebGL here" is silence, not a stack trace.
   *
   * Reported as false during SSR so the server never renders a canvas the
   * client might not keep.
   */
  const supported = useSyncExternalStore(subscribeNever, hasWebGL2, () => false);
  const quality = useAppStore((state) => state.quality);
  const setGlFailed = useAppStore((state) => state.setGlFailed);
  // only the Lab stage pays for the fluid solver's render targets
  const labArmed = useLabPreview((state) => state.armed);
  const budget = budgetFor(quality);

  if (!supported) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
      // the glow behind the lattice is cheaper in CSS than in a shader
      style={{
        background:
          "radial-gradient(120% 90% at 82% 12%, rgba(76,125,246,0.16), transparent 62%)," +
          "radial-gradient(90% 80% at 10% 100%, rgba(43,79,176,0.18), transparent 60%)," +
          "var(--color-ground)",
      }}
    >
      <Canvas
        frameloop="never"
        dpr={budget.dpr}
        gl={{
          antialias: false,
          alpha: true,
          // the Lab's Hero Object is the only real geometry on the canvas, and
          // without this its own far side draws over its near side
          depth: true,
          stencil: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          setRenderer(gl);
        }}
        fallback={null}
        onError={() => setGlFailed(true)}
      >
        <FrameDriver />
        <LatticeField />
        {labArmed ? (
          <>
            <FluidField />
            <CurlFlow />
            <HeroObject />
            <DomainWarp />
          </>
        ) : null}
        <LogoDisperse src="/brand/logo_grad.png" />
      </Canvas>
    </div>
  );
}
