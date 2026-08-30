"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Esc returns to the menu.
 *
 * Behavioural only — it renders nothing. The visible way back is the HUD
 * breadcrumb, because a keyboard-only exit strands anyone using a mouse.
 */
export function StageEscape() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      // Don't hijack Esc while a field or dialog is handling it.
      if (target instanceof HTMLElement && target.closest("input, textarea, [role='dialog']")) {
        return;
      }
      event.preventDefault();
      router.push("/", { transitionTypes: ["nav-back"] });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
