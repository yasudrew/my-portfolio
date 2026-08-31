"use client";

import { create } from "zustand";

import type { StageId } from "@/content/stages";

/**
 * Which stage is highlighted on the board.
 *
 * Kept outside the menu component so that returning from `/work` puts the
 * highlight back on Work instead of resetting to the main panel. Boot state is
 * deliberately *not* here — see `BootProvider` for why that one has to be React
 * state.
 */
type ConsoleState = {
  cursor: StageId;
  setCursor: (cursor: StageId) => void;
};

export const useConsoleStore = create<ConsoleState>((set) => ({
  cursor: "work",
  setCursor: (cursor) => set({ cursor }),
}));
