"use client";

import { create } from "zustand";

import type { QualityTier } from "@/lib/quality/detect";

export type SceneId = "hero" | "works" | "about" | "playground" | "none";

type AppState = {
  /** resolved GPU tier — drives resolution, particle counts, post effects */
  quality: QualityTier;
  /** true when the user asked for reduced motion, or we degraded on purpose */
  reducedMotion: boolean;
  /** the WebGL scene currently owning the persistent canvas */
  scene: SceneId;
  /** first frame has been rendered and the intro can retract */
  ready: boolean;
  /** the canvas failed to initialise — DOM-only fallback is in effect */
  glFailed: boolean;

  setQuality: (quality: QualityTier) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setScene: (scene: SceneId) => void;
  setReady: (ready: boolean) => void;
  setGlFailed: (glFailed: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  quality: "high",
  reducedMotion: false,
  scene: "hero",
  ready: false,
  glFailed: false,

  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setScene: (scene) => set({ scene }),
  setReady: (ready) => set({ ready }),
  setGlFailed: (glFailed) => set({ glFailed }),
}));
