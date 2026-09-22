import { z } from "zod";

/**
 * Paid client work.
 *
 * The flow is client → designer → here: the design arrives as a comp, and the
 * build, the setup and the CMS are this side of the line. `designer` is
 * required because the credit belongs on every entry, not because anything is
 * counted from it.
 *
 * Two tiers on purpose. The required fields are quick enough to fill in for
 * every job as it ships; `story` is the expensive part and is reserved for the
 * pieces that earn it. Keeping the deep tier optional is what stops the list
 * from going stale.
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
   * Hero shot of the live site, under `/public`.
   *
   * Optional because it cannot always be captured: a hero driven by WebGL
   * renders as an empty frame in headless Chrome, and an empty frame is worse
   * than no image. Entries without one fall back to a typographic card.
   */
  shot: z.string().optional(),
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
    shot: "/works/ashigara-seiga.webp",
  },
  {
    slug: "alumnote",
    title: "Alumnote",
    url: "https://corporate.alumnote.jp",
    designer: "高木康平",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/alumnote.webp",
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
    shot: "/works/hitorigokochi.webp",
  },
  {
    slug: "yeahgo-shirakawa",
    title: "ヤゴーシラカワ",
    url: "https://yeahgoshirakawa.com",
    designer: "神岡真拓",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/yeahgo-shirakawa.webp",
  },
];

export const WORKS: readonly Work[] = RAW.map((work) => workSchema.parse(work));

export function workBySlug(slug: string): Work | undefined {
  return WORKS.find((work) => work.slug === slug);
}
