"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type BootValue = {
  /** false while the title card is up */
  booted: boolean;
  boot: () => void;
};

const BootContext = createContext<BootValue | null>(null);

/**
 * Holds the one piece of state that has to be React's own.
 *
 * `<ViewTransition>` only animates updates that happen inside a Transition, and
 * only React state qualifies — an external store (zustand, and anything else
 * behind `useSyncExternalStore`) commits synchronously, so wrapping its setter
 * in `startTransition` does nothing. Booting the console is exactly the moment
 * we need a shared-element morph for, so it lives here instead.
 *
 * Mounted in the root layout, which persists across navigation: leaving a stage
 * and coming back does not replay the intro.
 */
export function BootProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);

  const boot = useCallback(() => {
    startTransition(() => setBooted(true));
  }, []);

  const value = useMemo(() => ({ booted, boot }), [booted, boot]);

  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
}

export function useBoot(): BootValue {
  const value = useContext(BootContext);
  if (!value) throw new Error("useBoot must be used inside a BootProvider");
  return value;
}
