import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";

import { CAREER, periodOf } from "@/content/career";

export const metadata: Metadata = { title: "Career" };

/**
 * The work history.
 *
 * Scrolls, like the case studies do, because it is read top to bottom rather
 * than browsed. Newest first: the question this page answers is "what is this
 * person doing now", and the years before that are context for it.
 */
export default function CareerPage() {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <article className="mx-auto w-full max-w-3xl px-4 pt-4 pb-24 md:px-9">
        <Link
          href="/about"
          transitionTypes={["nav-back"]}
          className="inline-block font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase transition-colors duration-200 hover:text-blue-lit"
        >
          ← About
        </Link>

        <header className="mt-8 grid gap-3">
          <h1 className="text-[clamp(2rem,5.5vw,3.2rem)] leading-none font-extralight tracking-[-0.03em]">
            {CAREER.name}
          </h1>
          <p className="font-mono text-[0.68rem] tracking-[0.14em] text-ink-faint">
            {CAREER.reading}
          </p>
        </header>

        <ol className="mt-12 grid gap-10">
          {CAREER.roles.map((role) => (
            <li
              key={role.company}
              className="grid gap-2 border-l border-edge-soft pl-6 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:border-l-0 sm:pl-0"
            >
              <p className="font-mono text-[0.66rem] tracking-[0.1em] text-ink-faint sm:pt-1.5">
                {periodOf(role)}
              </p>

              <div className="grid gap-1.5">
                <h2 className="text-[1.15rem] leading-tight font-light tracking-tight text-ink">
                  {role.company}
                </h2>
                <p className="font-mono text-[0.66rem] tracking-[0.1em] text-blue-lit">
                  {role.title}
                </p>
                <p className="mt-1 text-[0.94rem] leading-relaxed text-ink-dim">
                  {role.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-12 border-t border-edge-soft pt-8 text-[0.88rem] leading-relaxed text-ink-faint">
          {CAREER.note}
        </p>
      </article>
    </ViewTransition>
  );
}
