"use client";

import { create } from "zustand";

import type { StageId } from "@/content/stages";

/**
 * Console state that has to outlive a route change.
 *
 * The selected stage lives here rather than in the menu component so that
 * returning from `/works` puts the highlight back on Works instead of resetting
 * to the top of the list. Boot state is deliberately *not* here — see
 * `BootProvider` for why it has to be React state.
 */
type ConsoleState = {
  /** index into STAGES */
  cursor: number;
  setCursor: (cursor: number) => void;
  setCursorById: (id: StageId, stages: readonly { id: StageId }[]) => void;
};

export const useConsoleStore = create<ConsoleState>((set) => ({
  cursor: 0,
  setCursor: (cursor) => set({ cursor }),
  setCursorById: (id, stages) => {
    const index = stages.findIndex((stage) => stage.id === id);
    if (index >= 0) set({ cursor: index });
  },
}));
