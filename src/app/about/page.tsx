import type { Metadata } from "next";
import Link from "next/link";

import { StageScreen } from "@/components/console/StageScreen";
import { ABOUT } from "@/content/about";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <StageScreen id="about">
      <div className="grid max-w-2xl gap-10 pb-4">
        <section className="grid gap-4">
          {ABOUT.intro.map((paragraph) => (
            <p
              key={paragraph.slice(0, 12)}
              className="text-[0.98rem] leading-relaxed text-ink-dim"
            >
              {paragraph}
            </p>
          ))}

          <Link
            href="/about/career"
            transitionTypes={["nav-forward"]}
            className="justify-self-start font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint uppercase transition-colors duration-200 hover:text-blue-lit"
          >
            Career →
          </Link>
        </section>

        <section className="grid gap-5 border-t border-edge-soft pt-8">
          <Label>できること</Label>
          <dl className="grid gap-5">
            {ABOUT.offers.map((offer) => (
              <div key={offer.title} className="grid gap-1.5">
                <dt className="text-[1.05rem] font-normal tracking-tight text-ink">
                  {offer.title}
                </dt>
                <dd className="text-[0.94rem] leading-relaxed text-ink-dim">
                  {offer.detail}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-5 border-t border-edge-soft pt-8">
          <Label>使うもの</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <StackGroup heading="受託" items={ABOUT.stack.client} lit />
            <StackGroup heading="個人制作" items={ABOUT.stack.personal} />
          </div>
          <p className="text-[0.88rem] leading-relaxed text-ink-faint">
            {ABOUT.stack.note}
          </p>
        </section>

        <section className="grid gap-5 border-t border-edge-soft pt-8">
          <Label>進め方</Label>
          <dl className="grid gap-4">
            {ABOUT.terms.map((term) => (
              <div
                key={term.label}
                className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4"
              >
                <dt className="font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint sm:pt-1">
                  {term.label}
                </dt>
                <dd className="text-[0.94rem] leading-relaxed text-ink-dim">
                  {term.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-4 border-t border-edge-soft pt-8">
          <Label>連絡先</Label>
          <a
            href={`mailto:${ABOUT.contact.email}`}
            className="justify-self-start text-[clamp(1.1rem,3.5vw,1.5rem)] font-light tracking-tight text-blue-lit underline-offset-[6px] transition-colors duration-200 hover:text-ink hover:underline"
          >
            {ABOUT.contact.email}
          </a>
          <p className="text-[0.88rem] text-ink-faint">{ABOUT.contact.note}</p>
        </section>
      </div>
    </StageScreen>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase">
      {children}
    </h2>
  );
}

/**
 * One column of the stack split.
 *
 * The client column is lit and the personal one is not: which of the two is
 * paid experience is the distinction a reader is actually making, so the
 * styling should not flatten it.
 */
function StackGroup({
  heading,
  items,
  lit = false,
}: {
  heading: string;
  items: readonly string[];
  lit?: boolean;
}) {
  return (
    <div className="grid content-start gap-2.5">
      <h3 className="font-mono text-[0.62rem] tracking-[0.14em] text-ink-faint">
        {heading}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={[
              "rounded-full border px-2.5 py-1 font-mono text-[0.64rem] tracking-[0.06em]",
              lit
                ? "border-edge text-ink-dim"
                : "border-edge-soft text-ink-faint",
            ].join(" ")}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
