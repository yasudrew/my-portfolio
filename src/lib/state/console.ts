"use client";

import { create } from "zustand";

import type { BoardId } from "@/content/stages";

/**
 * Which tile is highlighted on the board.
 *
 * Kept outside the menu component so that returning from `/work` puts the
 * highlight back on Work instead of resetting to the first service. Boot state is
 * deliberately *not* here — see `BootProvider` for why that one has to be React
 * state.
 */
type ConsoleState = {
  cursor: BoardId;
  setCursor: (cursor: BoardId) => void;
};

export const useConsoleStore = create<ConsoleState>((set) => ({
  cursor: "tekutan",
  setCursor: (cursor) => set({ cursor }),
}));
