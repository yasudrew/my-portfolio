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

  note: "Workに並べているサイトは、marocreate として個人で受けた仕事です。",
});

/** Current roles read as "現在" rather than an end date. */
export function periodOf(role: Career["roles"][number]): string {
  return `${role.from} — ${role.to ?? "現在"}`;
}
