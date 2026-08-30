"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { getRenderer } from "@/gl/renderer";
import { frameState } from "@/lib/state/frame";
import { useAppStore } from "@/lib/state/store";
import { budgetFor } from "@/lib/quality/detect";

/**
 * Development overlay: fps, resolved quality budget and renderer counters.
 *
 * Enabled with `?debug`, and pairs with `?q=low|mid|high` to force a tier — the
 * two together are how the low-end behaviour gets verified on a fast machine.
 * Writes into the DOM directly instead of through React state so the readout
 * itself never costs a re-render.
 */
export function DebugHUD() {
  // `?debug` is a client-only fact. Reading it during render would break
  // hydration; reading it in an effect would cascade a second render. This is
  // the shape React provides for exactly that: a server snapshot of `false`,
  // and the real answer once mounted.
  const enabled = useSyncExternalStore(subscribeNever, readDebugFlag, () => false);
  const ref = useRef<HTMLPreElement>(null);
  const quality = useAppStore((state) => state.quality);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  useEffect(() => {
    if (!enabled) return;
    const budget = budgetFor(quality);

    const id = window.setInterval(() => {
      const node = ref.current;
      if (!node) return;
      const { fps, scroll } = frameState;
      const info = getRenderer()?.info;
      node.textContent = [
        `fps        ${fps.toFixed(1)}`,
        `tier       ${budget.tier}${reducedMotion ? " (reduced)" : ""}`,
        `dpr        ${budget.dpr}`,
        `draw calls ${info?.render.calls ?? 0}`,
        `textures   ${info?.memory.textures ?? 0}`,
        `programs   ${info?.programs?.length ?? 0}`,
        `scroll     ${(scroll.progress * 100).toFixed(1)}%`,
        `route      ${window.location.pathname}`,
      ].join("\n");
    }, 200);

    return () => window.clearInterval(id);
  }, [enabled, quality, reducedMotion]);

  if (!enabled) return null;

  return (
    <pre
      ref={ref}
      className="fixed top-14 right-4 z-50 rounded-sm border border-faint/60 bg-abyss/80 px-3 py-2 font-mono text-[10px] leading-relaxed text-ink-dim backdrop-blur-sm"
      aria-hidden="true"
    />
  );
}

/** The flag never changes for the life of the page, so there is nothing to subscribe to. */
function subscribeNever(): () => void {
  return () => {};
}

function readDebugFlag(): boolean {
  return new URLSearchParams(window.location.search).has("debug");
}
