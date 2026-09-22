import type { Metadata } from "next";

import { StageScreen } from "@/components/console/StageScreen";
import { LAB, STATUS_LABEL, type LabEntry } from "@/content/lab";

export const metadata: Metadata = { title: "Lab" };

/**
 * The playground.
 *
 * One column rather than a grid of tiles: each entry is a short read that ends
 * in something to take, and a tile would cut the body off exactly where the
 * useful part starts. Shelved pieces sit in the same list as the live ones,
 * undimmed — the point of keeping them is that they count.
 */
export default function LabPage() {
  return (
    <StageScreen id="lab">
      <ul className="grid max-w-[60ch] gap-10">
        {LAB.map((entry) => (
          <li key={entry.slug}>
            <Entry entry={entry} />
          </li>
        ))}
      </ul>
    </StageScreen>
  );
}

function Entry({ entry }: { entry: LabEntry }) {
  return (
    <article className="grid gap-3 border-t border-edge-soft pt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[1.15rem] leading-tight font-light tracking-tight text-ink">
          {entry.title}
        </h2>
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-ink-faint uppercase">
          {entry.kind}
          <span className="px-1.5">/</span>
          {STATUS_LABEL[entry.status]}
        </p>
      </div>

      <p className="text-[0.98rem] text-ink-dim">{entry.lede}</p>

      <div className="grid gap-2.5">
        {entry.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 16)}
            className="text-[0.92rem] leading-relaxed text-ink-faint"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ul className="flex flex-wrap gap-1.5">
          {entry.takeaways.map((takeaway) => (
            <li
              key={takeaway}
              className="rounded-full border border-edge px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em] text-ink-dim"
            >
              {takeaway}
            </li>
          ))}
        </ul>

        <code className="font-mono text-[0.66rem] tracking-[0.04em] text-ink-faint">
          {entry.source}
        </code>
      </div>
    </article>
  );
}
