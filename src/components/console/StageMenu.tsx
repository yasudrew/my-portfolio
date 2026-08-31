"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { HummingMonster } from "@/components/console/HummingMonster";
import { KeyGuide } from "@/components/console/KeyGuide";
import {
  BOARD_STAGES,
  GROUP_LABELS,
  NAV,
  stageById,
  stagesInGroup,
  type Stage,
  type StageId,
} from "@/content/stages";
import { formatDuration, TRACKS } from "@/content/tracks";
import { useBoot, type BootPhase } from "@/lib/state/BootProvider";
import { useConsoleStore } from "@/lib/state/console";

/** Entry counts shown beside each stage. Only real content is counted. */
const COUNTS: Partial<Record<StageId, number>> = { sound: TRACKS.length };

type PreviewItem = { label: string; meta?: string; real: boolean };

/**
 * A glimpse of what a stage holds.
 *
 * Without this the board is four words and a lot of dark space — the visitor
 * has to open a stage to find out whether anything is in it. Real entries are
 * listed by name; a stage that has none yet shows the kinds of thing it is for,
 * dimmed, so the difference between "full" and "waiting" is visible at a glance
 * rather than hidden behind a click.
 */
function previewItems(stage: Stage): readonly PreviewItem[] {
  if (stage.id === "sound") {
    const shown = TRACKS.slice(0, 4).map((track) => ({
      label: track.title,
      meta: formatDuration(track.duration),
      real: true,
    }));
    const rest = TRACKS.length - shown.length;
    return rest > 0
      ? [...shown, { label: `ほか${rest}曲`, real: true }]
      : shown;
  }

  return stage.holds.map((held) => ({ label: held, real: false }));
}

/**
 * Move keyboard focus to a stage.
 *
 * Queried from the DOM rather than held in a ref map: the map had to be built
 * during render to hand each link its callback, which is exactly what React
 * Compiler forbids. A single lookup on keypress costs nothing and keeps the
 * render pure.
 */
function focusStage(id: StageId): void {
  document
    .querySelector<HTMLAnchorElement>(`[data-stage="${id}"]`)
    ?.focus({ preventScroll: true });
}

export function StageMenu() {
  const { phase, booted, boot } = useBoot();
  const cursor = useConsoleStore((state) => state.cursor);
  const setCursor = useConsoleStore((state) => state.setCursor);

  const lockupRef = useRef<HTMLButtonElement | null>(null);
  /** which column the visitor dropped down from, so `up` returns there */
  const lastColumn = useRef<StageId>("works");

  /**
   * Move the highlight and take the focus with it.
   *
   * These two must never disagree: if hovering moves the highlight but leaves
   * the focus behind, the next arrow key jumps from somewhere nobody was
   * looking. Because they always match, the highlight *is* the focus indicator
   * — which is why the stages suppress their own focus ring.
   */
  const selectStage = useCallback(
    (id: StageId) => {
      setCursor(id);
      if (id === "works" || id === "sound") lastColumn.current = id;
      focusStage(id);
    },
    [setCursor],
  );

  const navigate = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (cursor === "about") return;
      const next =
        direction === "up" && cursor === "thought"
          ? lastColumn.current
          : NAV[cursor][direction];
      if (next) selectStage(next);
    },
    [cursor, selectStage],
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

      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const direction = map[event.key];
      if (!direction) return;
      event.preventDefault();
      navigate(direction);
      // Enter is deliberately not handled: the stages are real links, so the
      // browser already activates the focused one.
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booted, navigate]);

  // Entering the board hands focus to the current stage so the arrows work
  // without asking the visitor to click first.
  useEffect(() => {
    if (!booted) return;
    const id = window.setTimeout(() => focusStage(cursor), 280);
    return () => window.clearTimeout(id);
    // Only on the boot edge — `selectStage` handles focus from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  if (!booted) {
    return <TitleCard ref={lockupRef} phase={phase} onStart={boot} />;
  }

  const selected = stageById(cursor) ?? BOARD_STAGES[0];
  const [engineering] = stagesInGroup("engineering");
  const [expression] = stagesInGroup("expression");
  const [foundation] = stagesInGroup("foundation");

  return (
    <>
      <div className="grid min-h-0 flex-1 content-center gap-6 overflow-y-auto px-4 py-4 md:px-9 lg:gap-8">
        {/* the two sides */}
        <div className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8">
          <StageColumn
            stage={engineering}
            group="engineering"
            selected={cursor === engineering.id}
            count={COUNTS[engineering.id]}
            onSelect={selectStage}
            delay={0}
          />
          <StageColumn
            stage={expression}
            group="expression"
            selected={cursor === expression.id}
            count={COUNTS[expression.id]}
            onSelect={selectStage}
            delay={70}
          />
        </div>

        {/* the foundation under both */}
        <div className="mx-auto w-full max-w-4xl">
          <div
            className="stage-in mb-3 flex items-center gap-4"
            style={{ animationDelay: "150ms" }}
          >
            <span className="h-px flex-1 bg-edge-soft" />
            <span className="font-mono text-[0.62rem] tracking-[0.2em] text-ink-faint uppercase">
              {GROUP_LABELS.foundation.jp}
            </span>
            <span className="h-px flex-1 bg-edge-soft" />
          </div>

          <Link
            href={`/${foundation.id}`}
            transitionTypes={["nav-forward"]}
            data-stage={foundation.id}
            onPointerEnter={() => selectStage(foundation.id)}
            onFocus={() => selectStage(foundation.id)}
            aria-current={cursor === foundation.id ? "true" : undefined}
            style={{ animationDelay: "210ms" }}
            className={[
              "stage-in flex items-baseline justify-center gap-4 rounded-sm border py-3 focus-visible:outline-none",
              "transition-[color,border-color,background] duration-200 ease-fluid",
              cursor === foundation.id
                ? "border-amber/60 bg-blue/10 text-ink"
                : "border-transparent text-ink-faint hover:text-ink-dim",
            ].join(" ")}
          >
            <span className="text-[clamp(1.15rem,2.6vh,1.6rem)] font-light tracking-tight">
              {foundation.label}
            </span>
            <span className="font-mono text-[0.66rem] tracking-[0.1em] text-ink-faint">
              {foundation.jp}
            </span>
            <span className="font-mono text-[0.62rem] tracking-[0.14em] text-edge uppercase">
              {foundation.holds.join(" · ")}
            </span>
          </Link>
        </div>

        {/* what the highlighted stage is, and the guide */}
        <div
          className="stage-in mx-auto flex w-full max-w-4xl items-end justify-between gap-6"
          style={{ animationDelay: "270ms" }}
        >
          <p className="max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-dim">
            {selected.lede}
          </p>

          <HummingMonster
            key={cursor}
            className="guide-perk pointer-events-none w-[clamp(88px,13vw,132px)] shrink-0 text-amber"
          />
        </div>
      </div>

      <KeyGuide
        guides={[
          { key: "← →", label: "Side" },
          { key: "↑ ↓", label: "Depth" },
          { key: "Enter", label: "Open" },
        ]}
      />
    </>
  );
}

/**
 * One side of the board.
 *
 * The group heading carries the argument, so it is not decoration:
 * `Engineering` / `Expression` is what explains why one person has both a
 * client-work section and a music section.
 */
function StageColumn({
  stage,
  group,
  selected,
  count,
  onSelect,
  delay,
}: {
  stage: Stage;
  group: "engineering" | "expression";
  selected: boolean;
  count?: number;
  onSelect: (id: StageId) => void;
  delay: number;
}) {
  const heading = GROUP_LABELS[group];

  return (
    <Link
      href={`/${stage.id}`}
      transitionTypes={["nav-forward"]}
      data-stage={stage.id}
      onPointerEnter={() => onSelect(stage.id)}
      onFocus={() => onSelect(stage.id)}
      aria-current={selected ? "true" : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={[
        "stage-in grid gap-3 border-l-2 py-4 pr-4 pl-5 focus-visible:outline-none",
        "transition-[color,border-color,background,padding] duration-200 ease-fluid",
        selected
          ? "border-amber bg-gradient-to-r from-blue/15 to-transparent to-70% pl-6 text-ink"
          : "border-edge-soft text-ink-faint hover:text-ink-dim",
      ].join(" ")}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span
          className={[
            "font-mono text-[0.66rem] tracking-[0.2em] uppercase transition-colors duration-200",
            selected ? "text-amber" : "text-edge",
          ].join(" ")}
        >
          {heading.label}
        </span>
        <span className="font-mono text-[0.62rem] tracking-[0.1em] text-ink-faint tabular-nums">
          {count !== undefined ? String(count).padStart(2, "0") : "—"}
        </span>
      </span>

      <span className="text-[clamp(1.6rem,4.2vh,2.6rem)] leading-none font-light tracking-tight">
        {stage.label}
      </span>

      <span className="font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint">
        {heading.jp}
      </span>

      <StagePreviewList items={previewItems(stage)} />
    </Link>
  );
}

/** The contents glimpse under a stage name. */
function StagePreviewList({ items }: { items: readonly PreviewItem[] }) {
  return (
    <ul className="mt-1 grid gap-1.5 border-t border-edge-soft pt-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-baseline justify-between gap-3 font-mono text-[0.68rem] tracking-[0.04em]"
        >
          <span className={item.real ? "text-ink-dim" : "text-edge"}>
            {item.real ? item.label : item.label.toUpperCase()}
          </span>
          {item.meta ? (
            <span className="text-ink-faint tabular-nums">{item.meta}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The title card. Shown once per session — returning from a stage drops the
 * visitor straight back into the board rather than replaying the intro.
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
        {/* No transition on the way out: the particles pick up in the exact
            frame this goes, and a fade here would show both at once. */}
        <Image
          ref={imageRef}
          src="/brand/logo_grad.png"
          alt="marocreate — Connect small, land thought"
          width={1184}
          height={203}
          priority
          className={
            leaving
              ? "h-auto w-[min(78vw,34rem)] opacity-0"
              : "h-auto w-[min(78vw,34rem)]"
          }
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
