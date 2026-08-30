"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { advanceGL } from "@/gl/frameloop";
import { frameState, MAX_DELTA } from "@/lib/state/frame";
import { useAppStore } from "@/lib/state/store";
import { demote, detectQualityTier, isTierPinned, prefersReducedMotion } from "@/lib/quality/detect";

/** Scroll velocity treated as "fast" when normalising for shaders (px/frame). */
const VELOCITY_REFERENCE = 60;
/** How quickly pointer energy decays back to zero, per second. */
const POINTER_DECAY = 4;
/** Sustained fps below this triggers a one-way quality demotion. */
const DEMOTE_FPS = 40;
const DEMOTE_SAMPLES = 3;

/**
 * The single animation loop.
 *
 * One `requestAnimationFrame` drives smooth scrolling, pointer state and the
 * WebGL layer in that order, so the DOM and the canvas can never disagree about
 * which frame they are on. Renders nothing.
 */
export function FrameLoopProvider() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const store = useAppStore.getState();
    store.setReducedMotion(reduced);
    store.setQuality(reduced ? "low" : detectQualityTier());

    const lenis = new Lenis({
      duration: reduced ? 0 : 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: !reduced,
      syncTouch: false,
    });
    document.documentElement.classList.add("lenis");

    // --- pointer ------------------------------------------------------------
    const onPointerMove = (event: PointerEvent) => {
      const p = frameState.pointer;
      const ux = event.clientX / window.innerWidth;
      const uy = event.clientY / window.innerHeight;
      p.dx = ux - p.ux;
      p.dy = uy - p.uy;
      p.x = event.clientX;
      p.y = event.clientY;
      p.ux = ux;
      p.uy = uy;
      p.nx = ux * 2 - 1;
      p.ny = (1 - uy) * 2 - 1;
      p.speed = Math.min(1, Math.hypot(p.dx, p.dy) * 18);
      p.active = true;
    };
    const onPointerDown = () => { frameState.pointer.down = true; };
    const onPointerUp = () => { frameState.pointer.down = false; };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    // --- the loop -----------------------------------------------------------
    let raf = 0;
    let lastMs = 0;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let slowSamples = 0;
    const pinned = isTierPinned();

    const tick = (nowMs: number) => {
      raf = requestAnimationFrame(tick);

      // 1. settle scrolling before anyone reads it
      lenis.raf(nowMs);

      // 2. publish time
      const delta = lastMs === 0 ? 1 / 60 : Math.min((nowMs - lastMs) / 1000, MAX_DELTA);
      lastMs = nowMs;
      frameState.time.delta = delta;
      frameState.time.elapsed = nowMs / 1000;

      // 3. publish scroll
      const limit = Math.max(1, lenis.limit);
      const s = frameState.scroll;
      s.y = lenis.scroll;
      s.rawY = window.scrollY;
      s.velocity = lenis.velocity;
      s.normalizedVelocity = Math.max(-1, Math.min(1, lenis.velocity / VELOCITY_REFERENCE));
      s.progress = Math.max(0, Math.min(1, lenis.scroll / limit));
      s.direction = lenis.direction === 0 ? s.direction : lenis.direction;

      // 4. decay pointer energy so a parked cursor settles
      const p = frameState.pointer;
      p.speed = Math.max(0, p.speed - POINTER_DECAY * delta);

      // 5. render the WebGL layer
      advanceGL(nowMs);

      // 6. consume the pointer delta — a frame without a pointermove must not
      //    replay the previous frame's movement
      p.dx = 0;
      p.dy = 0;

      // 7. fps sampling and one-way degradation
      fpsAccum += delta;
      fpsFrames += 1;
      if (fpsAccum >= 0.25) {
        frameState.fps = fpsFrames / fpsAccum;
        fpsAccum = 0;
        fpsFrames = 0;

        if (!pinned && !reduced) {
          const current = useAppStore.getState().quality;
          if (frameState.fps < DEMOTE_FPS && current !== "low") {
            slowSamples += 1;
            if (slowSamples >= DEMOTE_SAMPLES) {
              useAppStore.getState().setQuality(demote(current));
              slowSamples = 0;
            }
          } else {
            slowSamples = 0;
          }
        }
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.documentElement.classList.remove("lenis");
      lenis.destroy();
    };
  }, []);

  return null;
}
