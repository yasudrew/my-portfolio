import type { Metadata } from "next";
import Link from "next/link";

import { StageScreen } from "@/components/console/StageScreen";
import { THOUGHTS } from "@/content/thought";

export const metadata: Metadata = { title: "Thought" };

/**
 * The writing, as a list of positions.
 *
 * Title and one line only. A piece here is short enough that a preview would
 * be most of it, and reading half an argument in a list is worse than deciding
 * from its title whether to open it.
 */
export default function ThoughtPage() {
  return (
    <StageScreen id="thought">
      <ul className="grid max-w-[56ch] gap-px">
        {THOUGHTS.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/thought/${entry.slug}`}
              transitionTypes={["nav-forward"]}
              className="group grid gap-1.5 border-t border-edge-soft py-5 transition-colors duration-200 hover:border-blue-deep"
            >
              <p className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-faint uppercase">
                {entry.pillar}
              </p>
              <h2 className="text-[1.15rem] leading-tight font-light tracking-tight text-ink transition-colors duration-200 group-hover:text-blue-lit">
                {entry.title}
              </h2>
              <p className="text-[0.92rem] leading-relaxed text-ink-dim">
                {entry.lede}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </StageScreen>
  );
}
