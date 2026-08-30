"use client";

import { useCallback, useEffect, useRef, ViewTransition } from "react";
import Link from "next/link";

import { HummingMonster } from "@/components/console/HummingMonster";
import { KeyGuide } from "@/components/console/KeyGuide";
import { STAGES } from "@/content/stages";
import { TRACKS } from "@/content/tracks";
import { useConsoleStore } from "@/lib/state/console";

/** Counts shown in the preview panel. Only real content is counted. */
const STAGE_COUNTS: Record<string, string> = {
  works: "—",
  sound: String(TRACKS.length),
  visual: "—",
  thought: "—",
  about: "—",
};

export function StageMenu() {
  const booted = useConsoleStore((state) => state.booted);
  const boot = useConsoleStore((state) => state.boot);
  const cursor = useConsoleStore((state) => state.cursor);
  const setCursor = useConsoleStore((state) => state.setCursor);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const move = useCallback(
    (delta: number, focus: boolean) => {
      const next = (cursor + delta + STAGES.length) % STAGES.length;
      setCursor(next);
      if (focus) itemRefs.current[next]?.focus({ preventScroll: true });
    },
    [cursor, setCursor],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!booted) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          boot();
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1, true);
      }
      // Enter is deliberately not handled: the stage rows are real links, so
      // the browser already activates the focused one. Reimplementing it here
      // would double-fire the navigation.
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booted, boot, move]);

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
    return <TitleCard onStart={boot} />;
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
                  onPointerEnter={() => setCursor(index)}
                  onFocus={() => setCursor(index)}
                  aria-current={isSelected ? "true" : undefined}
                  className={[
                    "grid grid-cols-[2.6rem_1fr_auto] items-baseline gap-4 border-l-2 py-2 pr-4 pl-4",
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

        <aside className="relative grid min-h-[clamp(12rem,34vh,19rem)] content-between gap-6 overflow-hidden rounded-sm border border-edge-soft bg-gradient-to-br from-surface-lift/80 to-ground/70 p-5 md:p-8">
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
            className="guide-perk pointer-events-none absolute right-3 bottom-2 w-[clamp(72px,12vw,108px)] text-amber md:right-5 md:bottom-4"
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
 */
function TitleCard({ onStart }: { onStart: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onStart}
        className="grid flex-1 cursor-pointer place-content-center px-4 text-center"
      >
        <p className="mb-6 font-mono text-[clamp(0.62rem,1.5vw,0.72rem)] tracking-[0.34em] text-ink-faint uppercase">
          Frontend Engineer · Producer · Thinker
        </p>
        <h1 className="bg-gradient-to-br from-blue via-blue-lit to-[#cfe0ff] bg-clip-text text-[clamp(2.6rem,9vw,6.5rem)] leading-[0.95] font-extralight tracking-[-0.035em] text-transparent">
          Portfolio
        </h1>
        <p className="mt-6 text-[clamp(0.9rem,2vw,1.05rem)] font-light text-ink-dim">
          つくったものを、選んで開く。
        </p>
        <p className="mt-12 animate-pulse font-mono text-[0.72rem] tracking-[0.24em] text-blue-lit uppercase">
          Press Enter / Click to start
        </p>
      </button>

      <KeyGuide guides={[{ key: "Enter", label: "Start" }]} />
    </>
  );
}
