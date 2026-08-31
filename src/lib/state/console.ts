"use client";

import { create } from "zustand";

import type { StageId } from "@/content/stages";

/**
 * Which stage is highlighted on the board.
 *
 * Kept outside the menu component so that returning from `/works` puts the
 * highlight back on Works instead of resetting to the top-left. Boot state is
 * deliberately *not* here — see `BootProvider` for why that one has to be React
 * state.
 */
type ConsoleState = {
  cursor: StageId;
  setCursor: (cursor: StageId) => void;
};

export const useConsoleStore = create<ConsoleState>((set) => ({
  cursor: "works",
  setCursor: (cursor) => set({ cursor }),
}));
