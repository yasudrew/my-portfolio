"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";

import { registerAdvance } from "@/gl/frameloop";
import { setRenderer } from "@/gl/renderer";
import { LatticeField } from "@/gl/scenes/LatticeField";
import { budgetFor } from "@/lib/quality/detect";
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
export function GLCanvas() {
  const quality = useAppStore((state) => state.quality);
  const setGlFailed = useAppStore((state) => state.setGlFailed);
  const budget = budgetFor(quality);

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
          depth: false,
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
      </Canvas>
    </div>
  );
}
