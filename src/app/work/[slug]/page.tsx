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

          {work.tagline ? (
            <p className="text-[1.02rem] font-light text-ink-dim">{work.tagline}</p>
          ) : null}

          {work.url ? (
            <a
              href={work.url}
              target="_blank"
              rel="noreferrer noopener"
              className="justify-self-start font-mono text-[0.72rem] tracking-[0.08em] text-blue-lit underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
            >
              {work.url.replace(/^https?:\/\//, "")} ↗
            </a>
          ) : null}
        </header>

        <div className="mt-8 overflow-hidden rounded-sm border border-edge-soft transition-colors duration-200 hover:border-blue-deep">
          {work.url ? (
            <a href={work.url} target="_blank" rel="noreferrer noopener" className="block">
              <Shot work={work} sizes="(min-width: 768px) 48rem, 92vw" priority />
            </a>
          ) : (
            <Shot work={work} sizes="(min-width: 768px) 48rem, 92vw" priority />
          )}
        </div>

        <dl className="grid gap-6 border-b border-edge-soft py-8 sm:grid-cols-2">
          {work.designer ? <Field label="Design" value={work.designer} /> : null}
          {work.year ? <Field label="Year" value={work.year} /> : null}
          <Field label="Role" value={work.role.join(" / ")} />
          <Field label="Stack" value={work.stack.join(" / ")} />
        </dl>

        {work.story ? (
          <section className="grid gap-8 border-b border-edge-soft py-8">
            <Passage heading="課題" body={work.story.problem} />

            <div className="grid gap-6">
              <h3 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint">
                解いたこと
              </h3>
              {work.story.decisions.map((decision) => (
                <div key={decision.title} className="grid gap-2">
                  <h4 className="text-[0.98rem] font-light text-ink">
                    {decision.title}
                  </h4>
                  <p className="text-[0.98rem] leading-relaxed text-ink-dim">
                    {decision.detail}
                  </p>
                </div>
              ))}
            </div>

            {work.story.result ? (
              <Passage heading="結果" body={work.story.result} />
            ) : null}
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
