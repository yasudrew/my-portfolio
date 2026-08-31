"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { HummingMonster } from "@/components/console/HummingMonster";
import { KeyGuide } from "@/components/console/KeyGuide";
import {
  BOARD_STAGES,
  NAV,
  PLAY_HEADING,
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
 * Without it the board is four words and a lot of dark space, and the visitor
 * has to open a stage to learn whether anything is in it. Real entries are
 * listed by name; a stage with none yet shows what it covers, dimmed, so
 * "filled" and "waiting" are distinguishable at a glance.
 */
function previewItems(stage: Stage, limit: number): readonly PreviewItem[] {
  if (stage.id === "sound") {
    const shown = TRACKS.slice(0, limit).map((track) => ({
      label: track.title,
      meta: formatDuration(track.duration),
      real: true,
    }));
    const rest = TRACKS.length - shown.length;
    return rest > 0 ? [...shown, { label: `ほか${rest}曲`, real: true }] : shown;
  }

  return stage.holds
    .slice(0, limit)
    .map((held) => ({ label: held, real: false }));
}

/**
 * Move keyboard focus to a stage.
 *
 * Queried from the DOM rather than held in a ref map: the map had to be built
 * during render to hand each link its callback, which React Compiler forbids.
 * One lookup per keypress costs nothing and keeps the render pure.
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
  /** which playground tile the visitor left, so `down` returns to it */
  const lastPlay = useRef<StageId>("sound");

  /**
   * Move the highlight and take the focus with it.
   *
   * These two must never disagree: if hovering moves the highlight but leaves
   * the focus behind, the next arrow key jumps from somewhere nobody was
   * looking. Because they always match, the highlight *is* the focus indicator
   * — which is why the tiles suppress their own focus ring.
   */
  const selectStage = useCallback(
    (id: StageId) => {
      setCursor(id);
      if (id !== "work" && id !== "about") lastPlay.current = id;
      focusStage(id);
    },
    [setCursor],
  );

  const navigate = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (cursor === "about") return;
      const next =
        direction === "down" && cursor === "work"
          ? lastPlay.current
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
      // Enter is deliberately not handled: the tiles are real links, so the
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
  const [main] = stagesInGroup("main");
  const play = stagesInGroup("play");

  return (
    <>
      <div className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 grid-rows-[1fr_auto] gap-6 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="grid content-center gap-6">
        <MainPanel
          stage={main}
          selected={cursor === main.id}
          onSelect={selectStage}
        />

        <div className="grid gap-3">
          <div className="stage-in flex items-center gap-4" style={{ animationDelay: "180ms" }}>
            <span className="font-mono text-[0.62rem] tracking-[0.2em] text-ink-faint uppercase">
              {PLAY_HEADING.jp}
            </span>
            <span className="h-px flex-1 bg-edge-soft" />
            <span className="font-mono text-[0.58rem] tracking-[0.18em] text-edge uppercase">
              {PLAY_HEADING.label}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {play.map((stage, index) => (
              <PlayTile
                key={stage.id}
                stage={stage}
                selected={cursor === stage.id}
                count={COUNTS[stage.id]}
                onSelect={selectStage}
                delay={230 + index * 60}
              />
            ))}
          </div>
        </div>

      </div>

        <div
          className="stage-in flex items-end justify-between gap-6 pb-1"
          style={{ animationDelay: "430ms" }}
        >
          <p className="max-w-[52ch] text-[0.92rem] leading-relaxed text-ink-dim">
            {selected.lede}
          </p>

          <HummingMonster
            key={cursor}
            className="guide-perk pointer-events-none w-[clamp(84px,12vw,132px)] shrink-0 text-amber"
          />
        </div>
      </div>

      <KeyGuide
        guides={[
          { key: "↑ ↓", label: "Section" },
          { key: "← →", label: "Move" },
          { key: "Enter", label: "Open" },
        ]}
      />
    </>
  );
}

/**
 * The work, given the weight of the screen.
 *
 * Deliberately wider and louder than the playground row beneath it: the size
 * difference is the argument. An engineer first, who also makes things for the
 * fun of it — stated by layout rather than by a sentence explaining it.
 */
function MainPanel({
  stage,
  selected,
  onSelect,
}: {
  stage: Stage;
  selected: boolean;
  onSelect: (id: StageId) => void;
}) {
  return (
    <Link
      href={`/${stage.id}`}
      transitionTypes={["nav-forward"]}
      data-stage={stage.id}
      onPointerEnter={() => onSelect(stage.id)}
      onFocus={() => onSelect(stage.id)}
      aria-current={selected ? "true" : undefined}
      style={{ animationDelay: "0ms" }}
      className={[
        "stage-in group grid gap-6 rounded-sm border border-l-2 p-5 focus-visible:outline-none md:p-8",
        "transition-[color,border-color,background] duration-200 ease-fluid",
        selected
          ? "border-edge-soft border-l-amber bg-gradient-to-br from-blue/14 via-transparent to-transparent text-ink"
          : "border-edge-soft border-l-edge text-ink-dim hover:text-ink",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="grid gap-1">
          <span
            className={[
              "font-mono text-[0.66rem] tracking-[0.22em] uppercase transition-colors duration-200",
              selected ? "text-amber" : "text-edge",
            ].join(" ")}
          >
            Main
          </span>
          <span className="text-[clamp(2.2rem,6vh,3.6rem)] leading-none font-light tracking-tight">
            {stage.label}
          </span>
        </div>

        <p className="font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint">
          {stage.jp}
        </p>
      </div>

      {/* the three pillars, laid out as the offer rather than as a category list */}
      <ul className="grid gap-2 border-t border-edge-soft pt-4 sm:grid-cols-3 sm:gap-4">
        {stage.holds.map((held) => (
          <li
            key={held}
            className="flex items-baseline gap-2 text-[0.95rem] font-light"
          >
            <span
              className={[
                "font-mono text-[0.6rem] transition-colors duration-200",
                selected ? "text-amber" : "text-edge",
              ].join(" ")}
            >
              ▸
            </span>
            <span className={selected ? "text-ink" : "text-ink-dim"}>{held}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}

/** One tile in the playground row. */
function PlayTile({
  stage,
  selected,
  count,
  onSelect,
  delay,
}: {
  stage: Stage;
  selected: boolean;
  count?: number;
  onSelect: (id: StageId) => void;
  delay: number;
}) {
  const items = previewItems(stage, 3);

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
        "stage-in grid content-start gap-3 rounded-sm border border-l-2 p-4 focus-visible:outline-none",
        "transition-[color,border-color,background] duration-200 ease-fluid",
        selected
          ? "border-edge-soft border-l-amber bg-blue/10 text-ink"
          : "border-edge-soft border-l-edge-soft text-ink-faint hover:text-ink-dim",
      ].join(" ")}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[clamp(1.15rem,2.8vh,1.5rem)] leading-none font-light tracking-tight">
          {stage.label}
        </span>
        <span className="font-mono text-[0.6rem] tracking-[0.1em] text-ink-faint tabular-nums">
          {count !== undefined ? String(count).padStart(2, "0") : "—"}
        </span>
      </span>

      <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
        {stage.jp}
      </span>

      <ul className="grid gap-1 border-t border-edge-soft pt-2.5">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-baseline justify-between gap-2 font-mono text-[0.64rem]"
          >
            <span className={item.real ? "text-ink-dim" : "text-edge"}>
              {item.real ? item.label : item.label.toUpperCase()}
            </span>
            {item.meta ? (
              <span className="text-edge tabular-nums">{item.meta}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </Link>
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
