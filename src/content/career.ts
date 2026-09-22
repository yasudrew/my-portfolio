import { z } from "zod";

/**
 * The work history, for the reader who needs a name and a date.
 *
 * Deliberately not on the About page. Someone deciding whether to commission a
 * site wants terms and an address; someone deciding whether to hire a person
 * wants employers and years. They are two readers, and lengthening the page
 * everybody sees to serve the rarer one costs the common case.
 *
 * This is also the one page that uses the legal name. The rest of the site
 * speaks as `marocreate`, which is the right answer everywhere except here.
 */
export const careerSchema = z.object({
  /** the legal name — stated here and nowhere else on the site */
  name: z.string(),
  reading: z.string(),
  roles: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        /** as written on the record, not parsed into a date */
        from: z.string(),
        /** null while the role is current — two can be current at once */
        to: z.string().nullable(),
        summary: z.string(),
      }),
    )
    .min(1),
  /**
   * What came before the first job.
   *
   * A reader who sees a career starting in 2020 will go looking for the years
   * before it, and finding nothing is worse than finding an unusual answer.
   * Stated as a chain rather than a timeline because the order is the point:
   * the route into engineering ran through education, which is why the two
   * have stayed together since.
   */
  prelude: z.object({
    steps: z
      .array(z.object({ label: z.string(), detail: z.string().optional() }))
      .min(1),
    note: z.string(),
  }),
  /** how the client work on this site relates to the employers above */
  note: z.string(),
});

export type Career = z.infer<typeof careerSchema>;

export const CAREER: Career = careerSchema.parse({
  name: "河村恵彦",
  reading: "かわむら やすひこ",

  roles: [
    {
      company: "株式会社ミエタ",
      title: "プロダクトデザイン部",
      from: "2026年1月",
      to: null,
      summary:
        "社内アプリケーションの開発、業務効率化、DX推進を担当。教育事業をエンジニアリングで支える立ち位置です。",
    },
    {
      company: "株式会社EAST END CREATIVE",
      title: "フロントエンジニア",
      from: "2020年9月",
      to: null,
      summary:
        "ホームページ、コーポレートサイト、LPなどのWeb制作と運営業務。",
    },
  ],

  prelude: {
    steps: [
      {
        label: "デンマーク留学",
        detail: "社会教育を学ぶプログラムに3ヶ月間参加。",
      },
      { label: "熊本エコビレッジ" },
      { label: "プログラミングスクール" },
    ],
    note: "エンジニアとしてのキャリアはEAST END CREATIVEから始まっています。教育のほうから来て、あとから技術を覚えた順番です。",
  },

  note: "Workに並べているサイトは、すべて marocreate として個人で受けた仕事です。",
});

/** Current roles read as "現在" rather than an end date. */
export function periodOf(role: Career["roles"][number]): string {
  return `${role.from} — ${role.to ?? "現在"}`;
}
