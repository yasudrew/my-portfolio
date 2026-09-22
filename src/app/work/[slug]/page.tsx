import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ViewTransition } from "react";

import { Shot } from "@/components/console/WorkList";
import { WORKS, workBySlug } from "@/content/works";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return WORKS.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = workBySlug(slug);
  return { title: work?.title ?? "Work" };
}

/**
 * A single piece of client work.
 *
 * The one place on the site that scrolls: the board and the stages are fixed
 * frames, but a case study is read top to bottom and should behave like it.
 */
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const work = workBySlug(slug);
  if (!work) notFound();

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <article className="mx-auto w-full max-w-3xl px-4 pt-4 pb-24 md:px-9">
        <Link
          href="/work"
          transitionTypes={["nav-back"]}
          className="inline-block font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase transition-colors duration-200 hover:text-blue-lit"
        >
          ← Work
        </Link>

        <header className="mt-8 grid gap-4">
          <h1 className="text-[clamp(2rem,5.5vw,3.2rem)] leading-none font-extralight tracking-[-0.03em]">
            {work.title}
          </h1>

          <a
            href={work.url}
            target="_blank"
            rel="noreferrer noopener"
            className="justify-self-start font-mono text-[0.72rem] tracking-[0.08em] text-blue-lit underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          >
            {work.url.replace(/^https?:\/\//, "")} ↗
          </a>
        </header>

        <a
          href={work.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-8 block overflow-hidden rounded-sm border border-edge-soft transition-colors duration-200 hover:border-blue-deep"
        >
          <Shot work={work} sizes="(min-width: 768px) 48rem, 92vw" priority />
        </a>

        <dl className="grid gap-6 border-b border-edge-soft py-8 sm:grid-cols-2">
          <Field label="Design" value={work.designer} />
          {work.year ? <Field label="Year" value={work.year} /> : null}
          <Field label="Role" value={work.role.join(" / ")} />
          <Field label="Stack" value={work.stack.join(" / ")} />
        </dl>

        {work.motion ? (
          <section className="border-b border-edge-soft py-8">
            <h2 className="font-mono text-[0.66rem] tracking-[0.16em] text-amber uppercase">
              Motion
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-dim">
              {work.motion}
            </p>
          </section>
        ) : null}

        {work.story ? (
          <section className="grid gap-8 border-b border-edge-soft py-8">
            <Passage heading="課題" body={work.story.problem} />
            <Passage heading="判断" body={work.story.decision} />
            <Passage heading="結果" body={work.story.result} />
          </section>
        ) : null}

      </article>
    </ViewTransition>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-faint uppercase">
        {label}
      </dt>
      <dd className="text-[0.98rem] font-light text-ink">{value}</dd>
    </div>
  );
}

function Passage({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="grid gap-2">
      <h3 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint">
        {heading}
      </h3>
      <p className="text-[0.98rem] leading-relaxed text-ink-dim">{body}</p>
    </div>
  );
}
