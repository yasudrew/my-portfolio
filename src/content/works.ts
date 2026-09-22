import { z } from "zod";

/**
 * The work, whether someone asked for it or not.
 *
 * `origin` splits the list in the only way that matters to a reader. A client
 * site arrives as a comp — the design belongs to whoever brought it in, and the
 * build, the setup and the CMS are this side of the line, so `designer` is a
 * credit that has to appear. Something built here has no such credit and needs
 * a line saying what it is instead.
 *
 * Two tiers on purpose. The required fields are quick enough to fill in for
 * every job as it ships; `story` is the expensive part and is reserved for the
 * pieces that earn it. Keeping the deep tier optional is what stops the list
 * from going stale.
 */
export const workSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    /** `client` — brought in by a designer. `self` — built here, unasked */
    origin: z.enum(["client", "self"]),
    /** one line saying what the thing is, where the title cannot say it alone */
    tagline: z.string().optional(),
    /** the live site, where there is one to link to */
    url: z.string().url().optional(),
    /** who brought the work in and owned the design — client work only */
    designer: z.string().optional(),
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
    /**
     * The deep tier, for representative pieces only.
     *
     * `decisions` is a list because a build is rarely one call: the useful part
     * is seeing which problems were solved and in what order. `result` is
     * optional — a tool that is simply in use has no number attached yet, and a
     * made-up one would be worse than none.
     */
    story: z
      .object({
        problem: z.string(),
        decisions: z
          .array(z.object({ title: z.string(), detail: z.string() }))
          .min(1),
        result: z.string().optional(),
      })
      .optional(),
  })
  .refine((work) => work.origin !== "client" || Boolean(work.designer), {
    message: "client work must credit its designer",
    path: ["designer"],
  });

export type Work = z.infer<typeof workSchema>;

/** What this side of the line covers on a client site, unless an entry says otherwise. */
const DEFAULT_ROLE = ["実装", "設計", "CMS構築"];
const DEFAULT_STACK = ["HTML", "CSS", "JavaScript", "WordPress"];

const RAW: readonly Work[] = [
  {
    slug: "ashigara-seiga",
    title: "足柄聖河",
    origin: "client",
    url: "https://fujibottling.co.jp/ashigaraseiga/",
    designer: "神岡真拓",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/ashigara-seiga.webp",
  },
  {
    slug: "alumnote",
    title: "Alumnote",
    origin: "client",
    url: "https://corporate.alumnote.jp",
    designer: "高木康平",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/alumnote.webp",
  },
  {
    slug: "less-but-better",
    title: "LESS, BUT BETTER",
    origin: "client",
    url: "https://lbb-official.com",
    designer: "BVC (bad vibes company)",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
  },
  {
    slug: "hitorigokochi",
    title: "ひとりごこち",
    origin: "client",
    url: "https://cocochi.design",
    designer: "高木康平",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/hitorigokochi.webp",
  },
  {
    slug: "yeahgo-shirakawa",
    title: "ヤゴーシラカワ",
    origin: "client",
    url: "https://yeahgoshirakawa.com",
    designer: "神岡真拓",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/yeahgo-shirakawa.webp",
  },
  {
    slug: "speakup",
    title: "SpeakUp",
    tagline: "使い捨てのリアルタイム声集めボード",
    origin: "self",
    role: ["企画", "設計", "実装"],
    stack: ["Supabase", "PostgreSQL", "JavaScript", "Cloudflare Pages"],
    story: {
      problem:
        "研修やワークショップで、参加者の声をその場で集めて映したい。ただしアカウント登録を挟んだ時点で、会場の手は止まる。QRを読んで、書いて、終わり。そこまでの導線を最優先にした。テーマを決めて部屋を作るとリンクとQRが出て、届いた声は付箋としてボードに流れる。進行役はドラッグで整理でき、会が終われば部屋ごと閉じて捨てる。",
      decisions: [
        {
          title: "アカウントなしで、管理操作だけ守る",
          detail:
            "参加者に許すのは投稿と閲覧だけで、RLSで制限している。非表示・移動・リセット・部屋を閉じる操作は、管理者トークンを検証するPostgres関数を通さないと実行できない。権限を画面側ではなくデータベース側に置いた。",
        },
        {
          title: "スマホとプロジェクタで、同じ配置に見せる",
          detail:
            "付箋の座標は0〜1に正規化して保存している。画面サイズが変わっても相対位置が保たれる。",
        },
        {
          title: "人数が増えても重くしない",
          detail:
            "参加者側は常時接続を持たず、投稿だけを送る。購読するのは一覧を開いている間だけにした。",
        },
        {
          title: "投稿が増えてもボードが破綻しない",
          detail:
            "画面より広い仮想キャンバスを持たせ、ドラッグで移動、ピンチで拡大できる。「一斉整理」を押せば散らばった付箋が格子状に並び、文字量が違っても重ならない。",
        },
      ],
      result:
        "ビルド工程はなし。静的ファイルを置くだけで動く。使い捨てる前提の道具なので、残すための仕組みは何も持たせていない。",
    },
  },
];

export const WORKS: readonly Work[] = RAW.map((work) => workSchema.parse(work));

export function workBySlug(slug: string): Work | undefined {
  return WORKS.find((work) => work.slug === slug);
}
