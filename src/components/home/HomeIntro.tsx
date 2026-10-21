import Link from "next/link";

import { HOME } from "@/content/home";
import { SERVICES } from "@/content/services";
import { stageById, type Stage } from "@/content/stages";
import { WORKS } from "@/content/works";

function requireStage(id: "work" | "about"): Stage {
  const stage = stageById(id);
  if (!stage) throw new Error(`Intro stage missing from stages.ts: ${id}`);
  return stage;
}

/** Work carries its count, as it does on the board. */
const PAGES = [
  { stage: requireStage("work"), action: "実績を見る", count: WORKS.length },
  { stage: requireStage("about"), action: "自己紹介を見る", count: undefined },
] as const;

/**
 * Who runs this site, below the title card.
 *
 * A server component on purpose: it is in the HTML whether or not the
 * console ever boots, and it stays put after it does — the page reads the same
 * to everyone, before and after the intro.
 */
export function HomeIntro() {
  return (
    <section
      aria-labelledby="home-intro"
      data-own-keys
      className="border-t border-edge-soft px-4 pt-14 pb-16 md:px-9 md:pt-20"
    >
      <div className="mx-auto grid w-full max-w-shell gap-12">
        <div className="grid max-w-2xl gap-4">
          <h2
            id="home-intro"
            className="text-[clamp(1.4rem,3.6vw,2rem)] leading-tight font-extralight tracking-[-0.02em] text-ink"
          >
            {HOME.heading}
          </h2>
          {HOME.intro.map((paragraph) => (
            <p
              key={paragraph.slice(0, 12)}
              className="text-[0.98rem] leading-relaxed text-ink-dim"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid gap-4">
          <Label>運営しているサービス</Label>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener"
                  className={cardClass}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[1.15rem] tracking-tight text-ink">
                      {service.name}
                    </span>
                    <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
                      {service.jp}
                    </span>
                  </span>
                  <span className="text-[0.9rem] text-ink-dim">{service.tagline}</span>
                  <span className="text-[0.9rem] leading-relaxed text-ink-dim">
                    {service.lede}
                  </span>
                  <span className={actionClass}>サイトを見る ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          <Label>このサイトの中身</Label>
          <ul className="grid gap-4 sm:grid-cols-[6.5fr_3.5fr]">
            {PAGES.map(({ stage, action, count }) => (
              <li key={stage.id}>
                <Link
                  href={`/${stage.id}`}
                  transitionTypes={["nav-forward"]}
                  className={cardClass}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[1.15rem] tracking-tight text-ink">
                      {stage.label}
                    </span>
                    <span className="font-mono text-[0.62rem] tracking-[0.12em] text-ink-faint">
                      {stage.jp}
                    </span>
                    {count !== undefined ? (
                      <span className="font-mono text-[0.62rem] tracking-[0.1em] text-ink-faint tabular-nums">
                        {String(count).padStart(2, "0")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[0.9rem] leading-relaxed text-ink-dim">
                    {stage.lede}
                  </span>
                  <span className={actionClass}>{action} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const cardClass =
  "group grid h-full content-start gap-2 rounded-sm border border-l-2 border-edge-soft border-l-edge p-4 transition-colors duration-200 hover:border-l-amber hover:bg-blue/10 sm:p-5";

const actionClass =
  "pt-1 text-[0.88rem] text-blue-lit underline-offset-[6px] transition-colors duration-200 group-hover:text-ink group-hover:underline";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase">
      {children}
    </h3>
  );
}
