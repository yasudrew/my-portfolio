"use client";

import { create } from "zustand";

/**
 * Which Lab entry is currently taking over the background.
 *
 * Two flags rather than one, because allocating a scene and showing it have to
 * happen at different moments. A fluid solver builds half a dozen render
 * targets; doing that on the frame the pointer arrives is a visible stall. So
 * the stage arms its scenes when it opens and the pointer only decides which
 * one is visible.
 *
 * `active` holds a slug rather than a boolean so the next entry to grow a
 * preview does not need a second store.
 */
type LabPreviewState = {
  /** the Lab stage is open — allocate, but stay invisible */
  armed: boolean;
  /** the entry the pointer has settled on, or null */
  active: string | null;
  setArmed: (armed: boolean) => void;
  setActive: (active: string | null) => void;
};

export const useLabPreview = create<LabPreviewState>((set) => ({
  armed: false,
  active: null,
  // leaving the stage must also clear the highlight, or the background stays
  // on a scene whose list is no longer on screen
  setArmed: (armed) => set(armed ? { armed } : { armed, active: null }),
  setActive: (active) => set({ active }),
}));

/** Entries that have a background to show. The rest hover inertly. */
export const PREVIEWABLE = new Set(["fluid-solver"]);
