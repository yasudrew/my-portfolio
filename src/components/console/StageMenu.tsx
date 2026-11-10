"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";

import { HummingMonster } from "@/components/console/HummingMonster";
import { KeyGuide } from "@/components/console/KeyGuide";
import { SERVICES, type Service } from "@/content/services";
import { NAV, stageById, type BoardId, type Stage } from "@/content/stages";
import { WORKS } from "@/content/works";
import {
  getLogoLive,
  hoverLogo,
  leaveLogo,
  playLogo,
  releaseLogo,
  subscribeLogoLive,
} from "@/gl/logoDisperse";
import { useConsoleStore } from "@/lib/state/console";
import { useAppStore } from "@/lib/state/store";

/**
 * Move keyboard focus to a tile.
 *
 * Queried from the DOM rather than held in a ref map: the map had to be built
 * during render to hand each link its callback, which React Compiler forbids.
 * One lookup per keypress costs nothing and keeps the render pure.
 */
function focusTile(id: BoardId): void {
  document
    .querySelector<HTMLAnchorElement>(`[data-tile="${id}"]`)
    ?.focus({ preventScroll: true });
}

function requireStage(id: "work" | "about"): Stage {
  const stage = stageById(id);
  if (!stage) throw new Error(`Board stage missing from stages.ts: ${id}`);
  return stage;
}

const WORK = requireStage("work");
const ABOUT = requireStage("about");


const ARROWS: Record<string, "left" | "right" | "up" | "down"> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

/**
 * The home page: the logo on the first screen, the board right under it.
 *
 * There used to be a door here — a title card that had to be clicked before
 * the board existed at all. It made a good entrance and an empty page: a
 * visitor who scrolled, or a reader without JavaScript, met a logo and nothing
 * else. Now the board is always there, and the logo became something to play
 * with instead of something to get past.
 */
export function StageMenu() {
  return (
    <>
      <Hero />
      <Board />
    </>
  );
}

/**
 * The first screen. One screen tall under the sticky HUD (its py-4 around a
 * 24px mark, 3.5rem), so the board starts at the fold.
 *
 * The lockup is a button: clicking takes it apart into particles and puts it
 * back together, and a pointer over it pushes the dots aside. Both are handed
 * to the WebGL layer, which draws the logo in dots while the `<img>` steps out
 * of the way; where WebGL is missing or motion is reduced the image simply
 * stays.
 */
function Hero() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const live = useSyncExternalStore(subscribeLogoLive, getLogoLive, () => false);
  const reducedMotion = useAppStore((state) => state.reducedMotion);

  useEffect(() => {
    const image = imageRef.current;
    return () => {
      if (image) releaseLogo(image);
    };
  }, []);

  const onPointer = (event: React.PointerEvent) => {
    if (reducedMotion || !imageRef.current) return;
    hoverLogo(imageRef.current, event.clientX, event.clientY);
  };

  return (
    <div className="grid min-h-[calc(100svh-3.5rem)] shrink-0 place-content-center justify-items-center gap-10 px-4 text-center">
      <button
        type="button"
        onClick={() => {
          if (!reducedMotion && imageRef.current) playLogo(imageRef.current);
        }}
        onPointerEnter={onPointer}
        onPointerMove={onPointer}
        onPointerLeave={leaveLogo}
        onPointerCancel={leaveLogo}
        className="cursor-pointer"
      >
        {/* No transition on the hand-off: the dots take over in the exact
            frame this goes, and a fade would show both at once. */}
        <Image
          ref={imageRef}
          src="/brand/logo_grad.png"
          alt="marocreate — Connect small, land thought"
          width={1184}
          height={203}
          priority
          className={
            live ? "h-auto w-[min(78vw,34rem)] opacity-0" : "h-auto w-[min(78vw,34rem)]"
          }
        />
      </button>

      <a
        href="#menu"
        className="prompt-breathe font-mono text-[0.72rem] tracking-[0.24em] text-blue-lit uppercase"
      >
        Scroll ↓
      </a>
    </div>
  );
}

/** The services, Work and About, a screen of their own under the logo. */
function Board() {
  const cursor = useConsoleStore((state) => state.cursor);
  const setCursor = useConsoleStore((state) => state.setCursor);

  /**
   * Move the highlight and take the focus with it.
   *
   * These two must never disagree: if hovering moves the highlight but leaves
   * the focus behind, the next arrow key jumps from somewhere nobody was
   * looking. Because they always match, the highlight *is* the focus indicator
   * — which is why the tiles suppress their own focus ring.
   */
  const selectTile = useCallback(
    (id: BoardId) => {
      setCursor(id);
      focusTile(id);
    },
    [setCursor],
  );

  // Arrows steer the board only while a tile has the focus; anywhere else on
  // the page they scroll it as usual. Enter is deliberately not handled: the
  // tiles are real links, so the browser already activates the focused one.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const direction = ARROWS[event.key];
    if (!direction) return;
    const next = NAV[cursor][direction];
    event.preventDefault();
    if (next) selectTile(next);
  };

  return (
    <section
      id="menu"
      aria-label="メニュー"
      onKeyDown={onKeyDown}
      className="flex min-h-[calc(100svh-3.5rem)] shrink-0 scroll-mt-14 flex-col"
    >
      <div className="mx-auto grid min-h-0 w-full max-w-shell flex-1 grid-rows-[1fr_auto] gap-4 px-4 py-4 sm:gap-6 sm:py-6 md:px-9 md:py-8">
        <div className="grid content-center gap-3 sm:gap-4">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {SERVICES.map((service, index) => (
              <ServicePanel
                key={service.id}
                service={service}
                selected={cursor === service.id}
                onSelect={selectTile}
                delay={index * 60}
              />
            ))}
          </div>

          {/* Work is the wider of the two: it is the other half of the claim,
              About is where the visitor goes to decide */}
          <div className="grid gap-3 sm:grid-cols-[6.5fr_3.5fr] sm:gap-4">
            <StageTile
              stage={WORK}
              selected={cursor === "work"}
              count={WORKS.length}
              onSelect={selectTile}
              delay={180}
            />
            <StageTile
              stage={ABOUT}
              selected={cursor === "about"}
              onSelect={selectTile}
              delay={240}
            />
          </div>
        </div>

        {/* Each tile carries its own description now, so the line that used to
            spell out the highlighted one is gone; the monster still follows. */}
        <div
          className="stage-in flex items-end justify-end gap-4 pb-1"
          style={{ animationDelay: "430ms" }}
        >
          <HummingMonster
            key={cursor}
            className="guide-perk pointer-events-none w-14 shrink-0 text-amber sm:w-[clamp(84px,12vw,132px)]"
          />
        </div>
      </div>

      <KeyGuide
        guides={[
          { key: "↑ ↓ ← →", label: "Move" },
          { key: "Enter", label: "Open" },
        ]}
      />
    </section>
  );
}

/** Shared frame for every tile, so selection reads the same everywhere. */
function tileClass(selected: boolean): string {
  return [
    "stage-in group rounded-sm border border-l-2 focus-visible:outline-none",
    "transition-[color,border-color,background] duration-200 ease-fluid",
    selected
      ? "border-edge-soft border-l-amber bg-gradient-to-br from-blue/14 via-transparent to-transparent text-ink"
      : "border-edge-soft border-l-edge text-ink-dim hover:text-ink",
  ].join(" ");
}

/** The small amber-or-faint marker before a pillar. */
function Pillars({ items, selected }: { items: readonly string[]; selected: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 border-t border-edge-soft pt-3">
      {items.map((item) => (
        <li key={item} className="flex items-baseline gap-2 text-[0.9rem] font-light">
          <span
            className={[
              "font-mono text-[0.6rem] transition-colors duration-200",
              selected ? "text-amber" : "text-ink-faint",
            ].join(" ")}
          >
            ▸
          </span>
          <span className={selected ? "text-ink" : "text-ink-dim"}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * One of the services, given the weight of the screen.
 *
 * Leaves the site: it opens in a new tab so the board is still here when the
 * visitor comes back. The thumbnail is the service's own share image, framed in
 * its paper colour, so what is shown here is what a link to it looks like
 * anywhere else.
 */
function ServicePanel({
  service,
  selected,
  onSelect,
  delay,
}: {
  service: Service;
  selected: boolean;
  onSelect: (id: BoardId) => void;
  delay: number;
}) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener"
      data-tile={service.id}
      onPointerEnter={() => onSelect(service.id)}
      onFocus={() => onSelect(service.id)}
      aria-current={selected ? "true" : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={`${tileClass(selected)} grid content-start gap-3 p-3 sm:gap-4 sm:p-4`}
    >
      <div
        className={[
          "flex h-[clamp(6.5rem,22vh,15rem)] items-center justify-center overflow-hidden rounded-[2px]",
          "transition-opacity duration-200",
          selected ? "opacity-100" : "opacity-80 group-hover:opacity-100",
        ].join(" ")}
        style={{ backgroundColor: service.thumbBg }}
      >
        <Image
          src={service.thumb}
          alt=""
          width={960}
          height={504}
          className="h-full w-auto max-w-full object-contain"
        />
      </div>

      <div className="grid gap-3 px-1">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="grid gap-1">
            <span
              className={[
                "font-mono text-[0.62rem] tracking-[0.22em] uppercase transition-colors duration-200",
                selected ? "text-amber" : "text-ink-faint",
              ].join(" ")}
            >
              Service
            </span>
            <span className="flex items-baseline gap-3">
              <span className="text-[clamp(1.4rem,3.6vh,2.2rem)] leading-none font-light tracking-tight">
                {service.name}
              </span>
              <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
                {service.jp}
              </span>
            </span>
          </div>

          <span className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
            <span aria-hidden className="size-1.5 rounded-full bg-amber/80" />
            {service.status} ↗
          </span>
        </div>

        <p className="text-[0.88rem] text-ink-dim">{service.tagline}</p>
        <p className="text-[0.84rem] leading-relaxed text-ink-dim">{service.lede}</p>

        <Pillars items={service.points} selected={selected} />
      </div>
    </a>
  );
}

/** Work or About: a page on this site, under the services. */
function StageTile({
  stage,
  selected,
  count,
  onSelect,
  delay,
}: {
  stage: Stage;
  selected: boolean;
  count?: number;
  onSelect: (id: BoardId) => void;
  delay: number;
}) {
  const id = stage.id;
  if (id !== "work" && id !== "about") throw new Error(`Not a board stage: ${id}`);

  return (
    <Link
      href={`/${id}`}
      transitionTypes={["nav-forward"]}
      data-tile={id}
      onPointerEnter={() => onSelect(id)}
      onFocus={() => onSelect(id)}
      aria-current={selected ? "true" : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={`${tileClass(selected)} grid content-start gap-3 p-4 sm:gap-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <span className="text-[clamp(1.4rem,3.6vh,2.2rem)] leading-none font-light tracking-tight">
          {stage.label}
        </span>

        <p className="flex items-baseline gap-3 font-mono text-[0.64rem] tracking-[0.14em] text-ink-faint">
          <span>{stage.jp}</span>
          {count !== undefined ? (
            <span className="text-[0.62rem] tracking-[0.1em] tabular-nums">
              {String(count).padStart(2, "0")}
            </span>
          ) : null}
        </p>
      </div>

      <p className="text-[0.84rem] leading-relaxed text-ink-dim">{stage.lede}</p>

      <Pillars items={stage.holds} selected={selected} />
    </Link>
  );
}

