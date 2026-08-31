"use client";

import { useCallback, useEffect, useRef, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";

import { HummingMonster } from "@/components/console/HummingMonster";
import { KeyGuide } from "@/components/console/KeyGuide";
import { STAGES } from "@/content/stages";
import { TRACKS } from "@/content/tracks";
import { useBoot, type BootPhase } from "@/lib/state/BootProvider";
import { useConsoleStore } from "@/lib/state/console";

/** Counts shown in the preview panel. Only real content is counted. */
const STAGE_COUNTS: Record<string, string> = {
  works: "—",
  sound: String(TRACKS.length),
  thought: "—",
  about: "—",
};

export function StageMenu() {
  const { phase, booted, boot } = useBoot();
  const cursor = useConsoleStore((state) => state.cursor);
  const setCursor = useConsoleStore((state) => state.setCursor);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const lockupRef = useRef<HTMLButtonElement | null>(null);

  /**
   * Move the selection and take the focus with it.
   *
   * These two must never disagree: if hovering moves the highlight but leaves
   * the focus behind, the next arrow key jumps from a row the visitor was not
   * looking at. Since they always match, the selection styling *is* the focus
   * indicator, which is why the rows suppress their own focus ring.
   */
  const selectAt = useCallback(
    (index: number) => {
      setCursor(index);
      itemRefs.current[index]?.focus({ preventScroll: true });
    },
    [setCursor],
  );

  const move = useCallback(
    (delta: number) => {
      selectAt((cursor + delta + STAGES.length) % STAGES.length);
    },
    [cursor, selectAt],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!booted) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          lockupRef.current?.click();
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      }
      // Enter is deliberately not handled: the stage rows are real links, so
      // the browser already activates the focused one. Reimplementing it here
      // would double-fire the navigation.
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booted, move]);

  // Entering the menu hands focus to the current row so the arrows work
  // without asking the visitor to click first.
  useEffect(() => {
    if (!booted) return;
    const id = window.setTimeout(
      () => itemRefs.current[cursor]?.focus({ preventScroll: true }),
      260,
    );
    return () => window.clearTimeout(id);
    // Only on the boot edge — re-focusing on every cursor change is handled in `move`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  if (!booted) {
    return <TitleCard ref={lockupRef} phase={phase} onStart={boot} />;
  }

  const selected = STAGES[cursor];

  return (
    <>
      <div className="grid min-h-0 flex-1 content-center gap-5 overflow-y-auto px-4 py-4 md:grid-cols-[minmax(18rem,1.05fr)_1.25fr] md:items-center md:gap-12 md:px-9 lg:gap-20">
        <ul className="grid gap-0.5" role="list">
          {STAGES.map((stage, index) => {
            const isSelected = index === cursor;
            return (
              <li key={stage.id}>
                <Link
                  href={`/${stage.id}`}
                  transitionTypes={["nav-forward"]}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  onPointerEnter={() => selectAt(index)}
                  onFocus={() => setCursor(index)}
                  aria-current={isSelected ? "true" : undefined}
                  style={{ animationDelay: `${index * 55}ms` }}
                  className={[
                    "stage-in grid grid-cols-[2.6rem_1fr_auto] items-baseline gap-4 border-l-2 py-2 pr-4 pl-4",
                    "focus-visible:outline-none",
                    "transition-[color,border-color,background,padding] duration-200 ease-fluid",
                    isSelected
                      ? "border-amber bg-gradient-to-r from-blue/15 to-transparent to-70% pl-6 text-ink"
                      : "border-transparent text-ink-faint hover:text-ink-dim",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-mono text-[0.68rem] tracking-[0.1em] transition-colors duration-200",
                      isSelected ? "text-amber" : "text-edge",
                    ].join(" ")}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Pairs with the heading on the stage page: the label the
                      visitor picked is the thing that becomes the title. */}
                  <ViewTransition
                    name={`stage-${stage.id}`}
                    share="stage-morph"
                    default="none"
                  >
                    <span className="text-[clamp(1.3rem,3.4vh,2.3rem)] leading-tight font-light tracking-tight">
                      {stage.label}
                    </span>
                  </ViewTransition>

                  <span
                    className={[
                      "font-mono text-[0.68rem] tracking-[0.1em] transition-colors duration-200",
                      isSelected ? "text-ink-faint" : "text-edge",
                    ].join(" ")}
                  >
                    {stage.jp}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <aside
          style={{ animationDelay: `${STAGES.length * 55 + 40}ms` }}
          className="stage-in relative grid min-h-[clamp(12rem,34vh,19rem)] content-between gap-6 overflow-hidden rounded-sm border border-edge-soft bg-gradient-to-br from-surface-lift/80 to-ground/70 p-5 md:p-8"
        >
          <div className="flex gap-6 font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint uppercase">
            <div>
              Entries
              <b className="mt-1 block font-display text-2xl font-light tracking-tight text-blue-lit tabular-nums">
                {STAGE_COUNTS[selected.id]}
              </b>
            </div>
            <div>
              Stage
              <b className="mt-1 block font-display text-2xl font-light tracking-tight text-blue-lit tabular-nums">
                {String(cursor + 1).padStart(2, "0")}
              </b>
            </div>
          </div>

          <p className="max-w-[32ch] text-[0.98rem] text-ink-dim">{selected.lede}</p>

          <div className="flex flex-wrap gap-1.5">
            {selected.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-edge px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* keyed on the selection: changing it remounts the guide, which
              replays its animation without any state living up here */}
          <HummingMonster
            key={cursor}
            className="guide-perk pointer-events-none absolute right-0 bottom-1 w-[clamp(104px,16vw,164px)] text-amber md:right-2 md:bottom-2"
          />
        </aside>
      </div>

      <KeyGuide
        guides={[
          { key: "↑ ↓", label: "Select" },
          { key: "Enter", label: "Open" },
        ]}
      />
    </>
  );
}

/**
 * The title card. Shown once per session — returning from a stage drops the
 * visitor straight back into the menu rather than replaying the intro.
 *
 * On start it hands its own `<img>` to the WebGL layer, which samples the
 * lockup's pixels and takes it apart. The DOM copy hides on the same frame, so
 * the visitor sees one object coming undone rather than an image swap.
 */
function TitleCard({
  ref,
  phase,
  onStart,
}: {
  ref: React.Ref<HTMLButtonElement>;
  phase: BootPhase;
  onStart: (lockup: HTMLElement | null) => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const leaving = phase === "leaving";

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => onStart(imageRef.current)}
        className="grid flex-1 cursor-pointer place-content-center justify-items-center gap-10 px-4 text-center"
      >
        <p
          className={[
            "font-mono text-[clamp(0.62rem,1.5vw,0.72rem)] tracking-[0.34em] text-ink-faint uppercase",
            "transition-opacity duration-300 ease-fluid",
            leaving ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          Frontend Engineer · Producer · Thinker
        </p>

        {/* No transition on the way out: the particles pick up in the exact
            frame this goes, and a fade here would show both at once. */}
        <Image
          ref={imageRef}
          src="/brand/logo_grad.png"
          alt="marocreate — Connect small, land thought"
          width={1184}
          height={203}
          priority
          className={leaving ? "h-auto w-[min(78vw,34rem)] opacity-0" : "h-auto w-[min(78vw,34rem)]"}
        />

        <p
          className={[
            "font-mono text-[0.72rem] tracking-[0.24em] text-blue-lit uppercase",
            "transition-opacity duration-300 ease-fluid",
            leaving ? "opacity-0" : "animate-pulse opacity-100",
          ].join(" ")}
        >
          Press Enter / Click to start
        </p>
      </button>

      <KeyGuide guides={[{ key: "Enter", label: "Start" }]} />
    </>
  );
}
