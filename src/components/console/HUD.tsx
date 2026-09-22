"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { stageById } from "@/content/stages";
import { useBoot } from "@/lib/state/BootProvider";

/**
 * The fixed frame around every screen.
 *
 * Carries `viewTransitionName: site-hud` so it stays anchored while content
 * slides underneath it — the visitor keeps one reference point that never
 * moves, which is what makes the sliding read as "the content moved" rather
 * than "the whole page jumped".
 *
 * Sticky as well, because a long stage scrolls: the board never does, so this
 * was invisible until About grew past a screen, and a reader who had scrolled
 * had no way back to the menu.
 */
export function HUD() {
  const pathname = usePathname();
  const { booted } = useBoot();
  const segment = pathname.split("/")[1] ?? "";
  const stage = stageById(segment);

  // The title card is a closed door: nothing but the lockup and the prompt.
  // The frame appears only once the visitor has stepped through it.
  if (pathname === "/" && !booted) return null;


  return (
    <header
      className="hud-in sticky top-0 z-20 flex items-center justify-between gap-4 bg-ground/85 px-4 py-4 backdrop-blur-sm md:px-9"
      style={{ viewTransitionName: "site-hud" }}
    >
      <Link
        href="/"
        transitionTypes={["nav-back"]}
        className="group flex items-center gap-3"
      >
        {/* the mark alone: at 24px the full lockup's tagline is unreadable */}
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={219}
          height={203}
          priority
          className="h-6 w-auto shrink-0 opacity-90 transition-opacity duration-200 group-hover:opacity-100"
        />
        {/* the brand name, set lowercase as the logo does */}
        <span className="text-[0.95rem] font-normal tracking-tight text-ink lowercase">
          marocreate
        </span>
      </Link>

      <nav
        aria-label="現在地"
        className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.16em] uppercase"
      >
        <span className="flex items-center gap-2">
          {stage ? (
            <>
              <Link
                href="/"
                transitionTypes={["nav-back"]}
                className="text-ink-faint transition-colors duration-200 hover:text-blue-lit"
              >
                Menu
              </Link>
              <span className="text-edge">/</span>
              <span className="text-blue-lit">{stage.label}</span>
            </>
          ) : (
            <span className="text-blue-lit">Menu</span>
          )}
        </span>

        {/* About is information about a person, not something they made, so it
            sits in the frame rather than on the board with the work. */}
        {pathname !== "/about" ? (
          <Link
            href="/about"
            transitionTypes={["nav-forward"]}
            className="text-ink-faint transition-colors duration-200 hover:text-ink"
          >
            About
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
