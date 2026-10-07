import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { StageScreen } from "@/components/console/StageScreen";
import { ABOUT } from "@/content/about";
import { LAB } from "@/content/lab";
import { SERVICES } from "@/content/services";
import { PLAY_HEADING, stagesInGroup, type StageId } from "@/content/stages";
import { THOUGHTS } from "@/content/thought";
import { TRACKS } from "@/content/tracks";

/** Entry counts for the playground. Only real content is counted. */
const PLAY_COUNTS: Partial<Record<StageId, number>> = {
  sound: TRACKS.length,
  lab: LAB.length,
  thought: THOUGHTS.length,
};

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

        <section className="grid gap-4 border-t border-edge-soft pt-8">
          <Label>運営しているサービス</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <a
                key={service.id}
                href={service.url}
                target="_blank"
                rel="noopener"
                className="group grid content-start gap-3 rounded-lg border border-edge p-3 transition-colors duration-200 hover:border-blue-lit/60"
              >
                <div
                  className="overflow-hidden rounded-[3px]"
                  style={{ backgroundColor: service.thumbBg }}
                >
                  <Image
                    src={service.thumb}
                    alt=""
                    width={960}
                    height={504}
                    className="h-auto w-full"
                  />
                </div>
                <p className="grid gap-1 px-1">
                  <span className="flex items-baseline gap-3">
                    <span className="text-[1.05rem] tracking-tight text-ink">
                      {service.name}
                    </span>
                    <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
                      {service.jp}
                    </span>
                  </span>
                  <span className="text-[0.88rem] text-ink-dim">{service.tagline}</span>
                </p>
                <p className="px-1 text-[0.9rem] leading-relaxed text-ink-dim">
                  {service.lede}
                </p>
                <span className="px-1 pb-1 text-[0.9rem] text-blue-lit underline-offset-[6px] transition-colors duration-200 group-hover:text-ink group-hover:underline">
                  サイトを見る ↗
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-t border-edge-soft pt-8">
          <Label>受託でできること</Label>
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

        <section className="grid gap-4 border-t border-edge-soft pt-8">
          <Label>
            {PLAY_HEADING.jp} — {PLAY_HEADING.label}
          </Label>
          <p className="text-[0.9rem] leading-relaxed text-ink-faint">
            仕事の外で、頼まれずにつくっているもの。
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {stagesInGroup("play").map((stage) => {
              const count = PLAY_COUNTS[stage.id];
              return (
                <li key={stage.id}>
                  <Link
                    href={`/${stage.id}`}
                    transitionTypes={["nav-forward"]}
                    className="group grid h-full content-start gap-2 rounded-sm border border-l-2 border-edge-soft border-l-edge-soft p-4 transition-colors duration-200 hover:border-l-amber hover:bg-blue/10"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex items-baseline gap-3">
                        <span className="text-[1.15rem] leading-none font-light tracking-tight text-ink">
                          {stage.label}
                        </span>
                        <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
                          {stage.jp}
                        </span>
                      </span>
                      {count !== undefined ? (
                        <span className="font-mono text-[0.6rem] tracking-[0.1em] text-ink-faint tabular-nums">
                          {String(count).padStart(2, "0")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[0.84rem] leading-relaxed text-ink-dim">
                      {stage.lede}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
