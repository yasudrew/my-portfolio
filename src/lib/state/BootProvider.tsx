"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { triggerDisperse } from "@/gl/logoDisperse";

/**
 * `title`   — the closed door: lockup and prompt, nothing else
 * `leaving` — the lockup has been handed to the particle layer and is coming
 *             apart; the DOM copy is already hidden
 * `console` — the menu, with the HUD in place
 */
export type BootPhase = "title" | "leaving" | "console";

/** How long the menu waits before arriving, in ms. Overlaps the dispersal. */
const HANDOFF_MS = 620;

type BootValue = {
  phase: BootPhase;
  /** convenience: the console is up */
  booted: boolean;
  /** hand the lockup element over and start the sequence */
  boot: (lockup: HTMLElement | null) => void;
};

const BootContext = createContext<BootValue | null>(null);

/**
 * Owns the opening sequence.
 *
 * Deliberately React state rather than the zustand store: the phase drives
 * mounting, and mixing it into an external store would put a render-affecting
 * value outside React's control for no benefit. Mounted in the root layout,
 * which persists across navigation — leaving a stage and coming back does not
 * replay the intro.
 */
export function BootProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<BootPhase>("title");
  const timer = useRef<number | undefined>(undefined);

  const boot = useCallback((lockup: HTMLElement | null) => {
    // Capture where the logo is *now*: the particle layer needs the same box
    // the visitor just clicked, and the DOM copy disappears on the next frame.
    if (lockup) triggerDisperse(lockup);
    setPhase("leaving");

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase("console"), HANDOFF_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({ phase, booted: phase === "console", boot }),
    [phase, boot],
  );

  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
}

export function useBoot(): BootValue {
  const value = useContext(BootContext);
  if (!value) throw new Error("useBoot must be used inside a BootProvider");
  return value;
}
