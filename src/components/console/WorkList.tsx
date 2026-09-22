import Link from "next/link";

import { designerTally, repeatCount, WORKS } from "@/content/works";

/**
 * The client work.
 *
 * Opens with the repeat count rather than with the list, because that is the
 * fact a designer reading this actually wants: not "he has built five sites"
 * but "four of them came back for a second one". The list underneath is
 * ordered as given, and every row names its designer so the recurrence is
 * visible without being claimed.
 */
export function WorkList() {
  const tally = designerTally();
  const repeats = repeatCount();

  return (
    <div className="grid gap-8">
      <dl className="flex flex-wrap gap-x-10 gap-y-4 border-b border-edge-soft pb-6">
        <Stat label="Projects" value={String(WORKS.length).padStart(2, "0")} />
        <Stat label="Designers" value={String(tally.length).padStart(2, "0")} />
        <Stat
          label="Repeat"
          value={String(repeats).padStart(2, "0")}
          note={`${tally.length}人中${tally.filter((t) => t.count > 1).length}人がリピート`}
        />
      </dl>

      <ul className="grid gap-px overflow-hidden rounded-sm border border-edge-soft bg-edge-soft">
        {WORKS.map((work) => (
          <li key={work.slug} className="bg-ground">
            <Link
              href={`/work/${work.slug}`}
              transitionTypes={["nav-forward"]}
              className="grid gap-3 px-4 py-5 transition-colors duration-200 hover:bg-surface/70 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
            >
              <span className="grid gap-1.5">
                <span className="text-[1.15rem] leading-tight font-light tracking-tight text-ink">
                  {work.title}
                </span>
                <span className="font-mono text-[0.64rem] tracking-[0.1em] text-ink-faint">
                  Design — {work.designer}
                </span>
              </span>

              <span className="flex flex-wrap items-center gap-2">
                {work.stack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-edge px-2.5 py-0.5 font-mono text-[0.6rem] tracking-[0.08em] text-ink-faint"
                  >
                    {tech}
                  </span>
                ))}
                <span className="ml-1 font-mono text-[0.62rem] tracking-[0.12em] text-blue-lit uppercase">
                  Open →
                </span>
              </span>
            </Link>
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

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="grid gap-1">
      <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-faint uppercase">
        {label}
      </dt>
      <dd className="grid gap-1">
        <span className="text-2xl leading-none font-light tracking-tight text-blue-lit tabular-nums">
          {value}
        </span>
        {note ? (
          <span className="font-mono text-[0.6rem] tracking-[0.08em] text-edge">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
