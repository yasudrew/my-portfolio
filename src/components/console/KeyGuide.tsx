"use client";

type Guide = { key: string; label: string };

/**
 * The permanent controls strip.
 *
 * Showing the bindings at all times is what tells a visitor this page is meant
 * to be driven from the keyboard — without it, the arrow keys are a secret.
 *
 * Hidden on touch, where there are no arrow keys to advertise and the strip is
 * just a row of symbols taking up the bottom of a short screen.
 */
export function KeyGuide({ guides }: { guides: readonly Guide[] }) {
  return (
    <footer className="key-guide flex flex-wrap gap-5 px-4 pt-4 pb-5 font-mono text-[0.68rem] tracking-[0.12em] text-ink-faint md:px-9">
      {guides.map((guide) => (
        <span key={guide.key} className="inline-flex items-center gap-2">
          <kbd className="inline-grid h-6 min-w-7 place-items-center rounded-[5px] border border-b-2 border-edge bg-surface px-1.5 text-[0.68rem] leading-none text-ink-dim">
            {guide.key}
          </kbd>
          {guide.label}
        </span>
      ))}
    </footer>
  );
}
