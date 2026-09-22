"use client";

import { useCallback, useEffect, useRef } from "react";

import { LAB, STATUS_LABEL, type LabEntry } from "@/content/lab";
import { PREVIEWABLE, useLabPreview } from "@/lib/state/labPreview";

/**
 * Milliseconds the pointer has to stay on an entry before it takes the screen.
 *
 * Without this, dragging the cursor down the list flips the background once per
 * row on the way past. Long enough to mean "this one", short enough that it
 * still feels like hover rather than a click.
 */
const DWELL_MS = 150;

/**
 * The playground.
 *
 * One column rather than a grid of tiles: each entry is a short read that ends
 * in something to take, and a tile would cut the body off exactly where the
 * useful part starts. Shelved pieces sit in the same list as the live ones,
 * undimmed — the point of keeping them is that they count.
 *
 * Entries that own a background scene hand it the whole screen while the
 * pointer rests on them. The page then has to defend its own legibility, which
 * is what the scrim below is for.
 */
export function LabList() {
  const armed = useLabPreview((state) => state.armed);
  const active = useLabPreview((state) => state.active);
  const setArmed = useLabPreview((state) => state.setArmed);
  const setActive = useLabPreview((state) => state.setActive);

  const timer = useRef<number | undefined>(undefined);

  // Arming allocates the scenes; disarming on the way out also clears the
  // highlight, so leaving the stage never strands the background on a fluid.
  useEffect(() => {
    setArmed(true);
    return () => setArmed(false);
  }, [setArmed]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const dwell = useCallback(
    (slug: string | null) => {
      window.clearTimeout(timer.current);
      if (slug === null) {
        setActive(null);
        return;
      }
      timer.current = window.setTimeout(() => setActive(slug), DWELL_MS);
    },
    [setActive],
  );

  return (
    <div className="relative">
      {/* Body text over a fluid simulation is unreadable, but flooding the
          whole screen with black to fix that also throws away the thing the
          visitor came to look at. The reading column occupies the left of the
          screen, so the page puts its own background back under the text and
          lets the fluid run clear of it. On a phone there is no "clear of it",
          so the cover stays closer to solid. */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none fixed inset-0 -z-[1] transition-opacity duration-500 ease-fluid",
          "bg-gradient-to-r from-ground from-55% to-ground/55",
          "sm:from-40% sm:to-ground/0",
          active ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <ul className="relative grid max-w-[60ch] gap-10">
        {LAB.map((entry) => (
          <li
            key={entry.slug}
            onPointerEnter={(event) => {
              // touch has no hover: a tap would latch the background on with
              // no way to dismiss it
              if (event.pointerType !== "mouse") return;
              dwell(PREVIEWABLE.has(entry.slug) ? entry.slug : null);
            }}
            onPointerLeave={() => dwell(null)}
          >
            <Entry
              entry={entry}
              playing={active === entry.slug}
              previewable={armed && PREVIEWABLE.has(entry.slug)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Entry({
  entry,
  playing,
  previewable,
}: {
  entry: LabEntry;
  playing: boolean;
  previewable: boolean;
}) {
  return (
    <article
      className={[
        "grid gap-3 border-t pt-6 transition-colors duration-300 ease-fluid",
        playing ? "border-amber" : "border-edge-soft",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[1.15rem] leading-tight font-light tracking-tight text-ink">
          {entry.title}
        </h2>
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-ink-faint uppercase">
          {entry.kind}
          <span className="px-1.5">/</span>
          {STATUS_LABEL[entry.status]}
        </p>

        {previewable ? (
          <p
            className={[
              // a device with no hover has nothing to promise here
              "ml-auto hidden font-mono text-[0.6rem] tracking-[0.14em] uppercase transition-colors duration-300",
              "[@media(hover:hover)]:block",
              playing ? "text-amber" : "text-edge",
            ].join(" ")}
          >
            {playing ? "背景で実行中" : "ホバーで実行"}
          </p>
        ) : null}
      </div>

      <p className="text-[0.98rem] text-ink-dim">{entry.lede}</p>

      <div className="grid gap-2.5">
        {entry.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 16)}
            className="text-[0.92rem] leading-relaxed text-ink-faint"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ul className="flex flex-wrap gap-1.5">
          {entry.takeaways.map((takeaway) => (
            <li
              key={takeaway}
              className="rounded-full border border-edge px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em] text-ink-dim"
            >
              {takeaway}
            </li>
          ))}
        </ul>

        <code className="font-mono text-[0.66rem] tracking-[0.04em] text-ink-faint">
          {entry.source}
        </code>
      </div>
    </article>
  );
}
