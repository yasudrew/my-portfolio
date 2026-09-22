import Image from "next/image";
import Link from "next/link";

import { WORKS, type Work } from "@/content/works";

/**
 * The client work.
 *
 * Screenshot-led, because these are websites: what they look like is the first
 * thing anyone judges, and a row of titles asks the reader to take that on
 * faith. Each card carries both destinations — the case study and the live
 * site — since a designer reading this usually wants the real thing.
 */
export function WorkList() {
  return (
    <div className="grid gap-8">
      <ul className="grid gap-5 sm:grid-cols-2">
        {WORKS.map((work) => (
          <li key={work.slug}>
            <WorkCard work={work} />
          </li>
        ))}
      </ul>

      <p className="max-w-[54ch] text-[0.88rem] leading-relaxed text-ink-faint">
        デザインはいずれもデザイナーの担当です。こちらは実装・設計・CMS構築を受け持っています。
        カンプに含まれない動きの設計は、毎回この手でやっています。
      </p>
    </div>
  );
}

function WorkCard({ work }: { work: Work }) {
  return (
    <article className="group grid gap-3">
      <Link
        href={`/work/${work.slug}`}
        transitionTypes={["nav-forward"]}
        className="block overflow-hidden rounded-sm border border-edge-soft bg-surface/50 transition-colors duration-200 hover:border-blue-deep"
      >
        <Shot work={work} sizes="(min-width: 640px) 45vw, 92vw" />
      </Link>

      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/work/${work.slug}`}
          transitionTypes={["nav-forward"]}
          className="grid gap-1"
        >
          <span className="text-[1.05rem] leading-tight font-light tracking-tight text-ink transition-colors duration-200 group-hover:text-blue-lit">
            {work.title}
          </span>
          <span className="font-mono text-[0.62rem] tracking-[0.1em] text-ink-faint">
            Design — {work.designer}
          </span>
        </Link>

        <a
          href={work.url}
          target="_blank"
          rel="noreferrer noopener"
          className="shrink-0 font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint uppercase transition-colors duration-200 hover:text-blue-lit"
        >
          Live ↗
        </a>
      </div>
    </article>
  );
}

/**
 * The hero image, or a stand-in built from the title.
 *
 * The fallback is deliberately not a grey box: a site with no capture yet still
 * has a name, and setting it in the page's own type keeps the grid even instead
 * of leaving a hole where a card should be.
 */
export function Shot({
  work,
  sizes,
  priority = false,
}: {
  work: Work;
  sizes: string;
  priority?: boolean;
}) {
  if (!work.shot) {
    return (
      <div className="grid aspect-[16/10] place-content-center bg-gradient-to-br from-surface-lift to-ground px-6">
        <span className="text-center text-[1.1rem] leading-snug font-light tracking-tight text-ink-dim">
          {work.title}
        </span>
        <span className="mt-2 text-center font-mono text-[0.58rem] tracking-[0.16em] text-edge uppercase">
          Capture pending
        </span>
      </div>
    );
  }

  return (
    <Image
      src={work.shot}
      alt={`${work.title} のファーストビュー`}
      width={1440}
      height={900}
      sizes={sizes}
      priority={priority}
      className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 ease-fluid group-hover:scale-[1.02]"
    />
  );
}
