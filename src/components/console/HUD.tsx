"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { stageById } from "@/content/stages";

/**
 * The fixed frame around every screen.
 *
 * Carries `viewTransitionName: site-hud` so it stays anchored while content
 * slides underneath it — the visitor keeps one reference point that never
 * moves, which is what makes the sliding read as "the content moved" rather
 * than "the whole page jumped".
 */
export function HUD() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  const stage = stageById(segment);

  return (
    <header
      className="flex items-center justify-between gap-4 px-4 py-4 md:px-9"
      style={{ viewTransitionName: "site-hud" }}
    >
      <Link
        href="/"
        transitionTypes={["nav-back"]}
        className="group flex items-center gap-3"
      >
        {/* the knocked-out mark alone: at 24px the full lockup's tagline is
            unreadable, so the wordmark belongs on the title card instead */}
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
        className="flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.16em] uppercase"
      >
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
      </nav>
    </header>
  );
}
