import { HOME } from "@/content/home";

/**
 * Who runs this site, under the board.
 *
 * The board says what is here; this says who made it, in plain sentences. The
 * services and pages are not listed again — the board above already links
 * every one of them.
 */
export function HomeIntro() {
  return (
    <section
      aria-labelledby="home-intro"
      className="border-t border-edge-soft px-4 pt-14 pb-16 md:px-9 md:pt-20"
    >
      <div className="mx-auto grid w-full max-w-shell">
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
      </div>
    </section>
  );
}
