import { z } from "zod";

/**
 * Paid client work.
 *
 * The flow is client → designer → here: the design arrives as a comp, and the
 * build, the setup and the CMS are this side of the line. That shape decides
 * what a reader needs to see, so `designer` is required rather than optional —
 * the same names recurring across entries is the strongest thing these five
 * pieces say, and it only shows if every entry carries one.
 *
 * Two tiers on purpose. Everything up to `motion` is quick enough to fill in
 * for every job as it ships; `story` is the expensive part and is reserved for
 * the pieces that earn it. Keeping the deep tier optional is what stops the
 * list from going stale.
 */
export const workSchema = z.object({
  slug: z.string(),
  title: z.string(),
  /** the live site */
  url: z.string().url(),
  /** who brought the work in and owned the design */
  designer: z.string(),
  /** left empty until confirmed — an unknown year beats a wrong one */
  year: z.string().optional(),
  /** what was actually done here */
  role: z.array(z.string()).min(1),
  stack: z.array(z.string()).min(1),
  /**
   * The part no comp specifies.
   *
   * Motion is never in the handoff, so it is designed here every time —
   * which makes it the clearest thing separating this from "someone who
   * marks up a PSD". One sentence is enough; it just has to be concrete.
   */
  motion: z.string().optional(),
  /** the deep tier, for representative pieces only */
  story: z
    .object({
      problem: z.string(),
      decision: z.string(),
      result: z.string(),
    })
    .optional(),
});

export type Work = z.infer<typeof workSchema>;

/** What this side of the line covers, unless an entry says otherwise. */
const DEFAULT_ROLE = ["実装", "設計", "CMS構築"];
const DEFAULT_STACK = ["HTML", "CSS", "JavaScript", "WordPress"];

const RAW: readonly Work[] = [
  {
    slug: "ashigara-seiga",
    title: "足柄聖河",
    url: "https://fujibottling.co.jp/ashigaraseiga/",
    designer: "神岡真拓",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
  {
    slug: "alumnote",
    title: "Alumnote",
    url: "https://corporate.alumnote.jp",
    designer: "高木康平",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
  {
    slug: "less-but-better",
    title: "LESS, BUT BETTER",
    url: "https://lbb-official.com",
    designer: "BVC (bad vibes company)",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
  {
    slug: "hitorigokochi",
    title: "ひとりごこち",
    url: "https://cocochi.design",
    designer: "高木康平",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
  {
    slug: "yeahgo-shirakawa",
    title: "ヤゴーシラカワ",
    url: "https://yeahgoshirakawa.com",
    designer: "神岡真拓",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
];

export const WORKS: readonly Work[] = RAW.map((work) => workSchema.parse(work));

export function workBySlug(slug: string): Work | undefined {
  return WORKS.find((work) => work.slug === slug);
}

export type DesignerTally = {
  designer: string;
  count: number;
};

/**
 * How many pieces came from each designer, most first.
 *
 * Derived rather than written down so it cannot drift from the list. The
 * repeat count is the argument these entries make together, and it should
 * update itself the moment a sixth job lands.
 */
export function designerTally(): readonly DesignerTally[] {
  const counts = new Map<string, number>();
  for (const work of WORKS) {
    counts.set(work.designer, (counts.get(work.designer) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([designer, count]) => ({ designer, count }))
    .sort((a, b) => b.count - a.count || a.designer.localeCompare(b.designer));
}

/** Pieces that came from a designer who has commissioned more than once. */
export function repeatCount(): number {
  const repeats = new Set(
    designerTally()
      .filter((entry) => entry.count > 1)
      .map((entry) => entry.designer),
  );
  return WORKS.filter((work) => repeats.has(work.designer)).length;
}
