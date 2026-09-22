import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ViewTransition } from "react";

import { THOUGHTS, thoughtBySlug } from "@/content/thought";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return THOUGHTS.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = thoughtBySlug(slug);
  if (!entry) return { title: "Thought" };

  return { title: entry.title, description: entry.lede };
}

/**
 * One piece of writing.
 *
 * Narrower than the case studies — this is prose rather than a spec sheet, and
 * a line of it should end before the eye has to travel back across the screen.
 */
export default async function ThoughtDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const entry = thoughtBySlug(slug);
  if (!entry) notFound();

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <article className="mx-auto w-full max-w-[44rem] px-4 pt-4 pb-24 md:px-9">
        <Link
          href="/thought"
          transitionTypes={["nav-back"]}
          className="inline-block font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase transition-colors duration-200 hover:text-blue-lit"
        >
          ← Thought
        </Link>

        <header className="mt-8 grid gap-3 border-b border-edge-soft pb-8">
          <p className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-faint uppercase">
            {entry.pillar}
          </p>
          <h1 className="text-[clamp(1.6rem,4.5vw,2.4rem)] leading-tight font-extralight tracking-[-0.02em]">
            {entry.title}
          </h1>
        </header>

        <div className="mt-8 grid gap-5">
          {entry.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 16)}
              className="text-[1rem] leading-[1.95] text-ink-dim"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </ViewTransition>
  );
}
