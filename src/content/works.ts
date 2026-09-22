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
    /**
     * Who brought the work in and owned the design.
     *
     * Present on everything that came through a designer, which is most of it.
     * Absent means either a job that arrived directly or a credit not yet
     * confirmed — an unfilled gap rather than a category.
     */
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
  });

export type Work = z.infer<typeof workSchema>;

/**
 * The common shape of a client build, for the entries that match it.
 *
 * Not every job does: some arrive without a CMS, some are static from the
 * start. Where an entry differs it spells its own out, because "だいたいこう"
 * is not something a reader deciding whether to hire can check.
 */
const DEFAULT_ROLE = ["実装", "設計", "CMS構築"];
const DEFAULT_STACK = ["HTML", "CSS", "JavaScript", "WordPress"];
/** A build with no CMS behind it. */
const STATIC_STACK = ["HTML", "CSS", "JavaScript"];

const RAW: readonly Work[] = [
  {
    slug: "ashigara-seiga",
    title: "足柄聖河",
    tagline: "リターナブルびんのミネラルウォーターのブランドサイト",
    origin: "client",
    url: "https://fujibottling.co.jp/ashigaraseiga/",
    designer: "神岡真拓",
    year: "2021",
    role: ["実装", "アニメーション"],
    stack: STATIC_STACK,
    shot: "/works/ashigara-seiga.webp",
  },
  {
    slug: "alumnote",
    title: "Alumnote",
    tagline: "大学経営を支えるスタートアップのコーポレートサイト",
    origin: "client",
    url: "https://corporate.alumnote.jp",
    designer: "高木康平",
    year: "2023",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/alumnote.webp",
  },
  {
    slug: "less-but-better",
    title: "LESS, BUT BETTER",
    tagline: "アップサイクル作品を扱うブランドのサイト",
    origin: "client",
    url: "https://lbb-official.com",
    designer: "BVC (bad vibes company)",
    year: "2023",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/less-but-better.webp",
  },
  {
    slug: "hitorigokochi",
    title: "ひとりごこち",
    tagline: "作品を「本」として並べるデザインスタジオのサイト",
    origin: "client",
    url: "https://cocochi.design",
    designer: "高木康平",
    year: "2022–2024",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/hitorigokochi.webp",
    story: {
      problem:
        "作品を「本」として見せるサイト。一覧は本棚に並び、詳細を開くと本を開いた見開きになる。カンプにある紙の比喩を、作品が増えても崩れず、クライアント自身が並べ替えられる状態まで持っていく必要があった。発注元はデザインスタジオ本人で、これはその自社サイトにあたる。",
      decisions: [
        {
          title: "本らしさは、厚みと傾きと開き方だけで出す",
          detail:
            "どうすれば本に見えるかだけを考えた。一覧は本棚から本を取り出す感じ、詳細に入ると左右の見開きになる。左が表紙で、右が中身。めくる音も紙の影も足していない。紙の比喩はやりすぎると途端に安っぽくなるので、足すより削る方向で寄せた。",
        },
        {
          title: "重なりの順序は、後から足さずに先に決める",
          detail:
            "本が重なって傾いていると、手前と奥の関係が常に動く。そこにカテゴリの切り替えと詳細への遷移が乗る。z-index を場当たりで決めると必ず破綻するので、重なりの順序を先に設計した。この案件で一番時間をかけたところ。",
        },
        {
          title: "並びの微調整は、クライアントの手に渡す",
          detail:
            "本の位置、傾き、降ってくる順番まで WordPress 側から設定できるようにした。発注元がデザイナーなので、見え方をこちらで固定したくなかった。1pxの調整のたびに実装者を挟まなくていい状態にしている。",
        },
      ],
    },
  },
  {
    slug: "yeahgo-shirakawa",
    title: "ヤゴーシラカワ",
    tagline: "白川町の公式メディア。記事が増えつづける前提のつくり",
    origin: "client",
    url: "https://yeahgoshirakawa.com",
    designer: "神岡真拓",
    year: "2023",
    role: DEFAULT_ROLE,
    stack: DEFAULT_STACK,
    shot: "/works/yeahgo-shirakawa.webp",
  },
  {
    slug: "naricom",
    title: "ナリコム",
    tagline: "赤坂のレンタルジム・サロン・スタジオを運営する会社のサイト",
    origin: "client",
    url: "https://naricom.jp/",
    designer: "KOKI NUMATA",
    year: "2021",
    role: ["実装", "アニメーション"],
    stack: STATIC_STACK,
    shot: "/works/naricom.webp",
  },
  {
    slug: "hakkohfudo",
    title: "発酵風土",
    tagline: "イースト×エンザイム発売10周年の特設サイト",
    origin: "client",
    url: "https://www.mdc.co.jp/prmo/yeastenzyme/hakkohfudo/",
    designer: "神岡真拓",
    year: "2022",
    role: ["実装", "アニメーション"],
    stack: STATIC_STACK,
    shot: "/works/hakkohfudo.webp",
  },
  {
    slug: "speakup",
    title: "SpeakUp",
    tagline: "使い捨てのリアルタイム声集めボード",
    origin: "self",
    url: "https://speakup-4zv.pages.dev/",
    year: "2026",
    role: ["企画", "設計", "実装"],
    stack: ["Supabase", "PostgreSQL", "JavaScript", "Cloudflare Pages"],
    shot: "/works/speakup.webp",
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
