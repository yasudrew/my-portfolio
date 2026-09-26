import { z } from "zod";

/**
 * About.
 *
 * Written for the person deciding whether to hand over a job. That reader
 * wants four things answered before anything else: what this person does,
 * where the line of responsibility sits, how long it takes, and how to make
 * contact. Most portfolios answer only the first — so the terms below are
 * stated plainly rather than left to be discovered in a first call.
 *
 * Including what is *not* covered (design, ongoing maintenance) is deliberate.
 * A stated boundary reads as someone who knows their shape; a vague one costs
 * both sides a meeting.
 */
export const aboutSchema = z.object({
  /** how this site refers to its author */
  name: z.string(),
  brand: z.string(),
  intro: z.array(z.string()).min(1),
  offers: z
    .array(z.object({ title: z.string(), detail: z.string() }))
    .min(1),
  /**
   * Split on purpose. Paid work runs on one stack and personal work on
   * another, and claiming the second as commercial experience would be a lie
   * a first technical conversation would expose.
   */
  stack: z.object({
    client: z.array(z.string()).min(1),
    personal: z.array(z.string()).min(1),
    note: z.string(),
  }),
  /**
   * The monthly service for small shops, run separately under its own name.
   * Linked from here rather than folded into `offers`: the reader of this page
   * is usually a designer, and the service is for their clients' neighbours,
   * not for them — so it gets one block and a way out, not the headline.
   */
  service: z.object({
    name: z.string(),
    tagline: z.string(),
    detail: z.string(),
    url: z.string().url(),
    cta: z.string(),
  }),
  terms: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  contact: z.object({
    email: z.string().email(),
    note: z.string(),
  }),
});

export type About = z.infer<typeof aboutSchema>;

export const ABOUT: About = aboutSchema.parse({
  name: "ろま",
  brand: "marocreate",

  intro: [
    "ろまです。marocreate という屋号でWebをつくっています。",
    "デザイナーから声をかけてもらい、実装・設計・CMS構築を担当する立ち位置です。デザインは依頼元が持ち、こちらは「それが実際に動くもの」になるまでを引き受けます。",
    "カンプに書かれていない部分——何がどう動くか、どこで間を取るか——は、毎回こちらで組み立てています。",
  ],

  offers: [
    {
      title: "HP構築",
      detail:
        "コーポレートサイト、ブランドサイト、ランディングページ。更新が必要なものはCMSまで組んで渡します。",
    },
    {
      title: "ツール開発",
      detail:
        "業務で使う小さな道具。使う人と使う場面が決まっているものを、その形に合わせてつくります。",
    },
    {
      title: "自動化系",
      detail:
        "手で回している工程を、仕組みに置き換える。毎回同じ手順を踏んでいる作業ほど向いています。",
    },
  ],

  stack: {
    client: ["HTML", "CSS", "JavaScript", "WordPress"],
    personal: ["Next.js", "React", "TypeScript", "WebGL"],
    note: "受託ではHTML/CSS/JavaScript/WordPressを使っています。Next.jsなどは個人制作で扱っているもので、受託での実績はまだありません（このサイトがそれです）。",
  },

  service: {
    name: "Kakari（カカリ）",
    tagline: "あなたのためのITかかりつけ",
    detail:
      "小さなお店や教室向けに、月額でデジタルまわりを見るサービスも個人でやっています。ホームページの更新から、予約や集計の自動化、AIの使いどころまで。月9,800円から、初回の診断は無料です。",
    url: "https://maro-partner.vercel.app/",
    cta: "Kakari のサイトを見る",
  },

  terms: [
    {
      label: "担当範囲",
      value: "実装・設計・CMS構築。デザインは含みません。",
    },
    {
      label: "期間",
      value: "1案件あたり1ヶ月程度。確認のやりとりを含めた実際の目安です。",
    },
    {
      label: "保守",
      value:
        "制作後も継続して見る場合は、月額のKakariでお受けしています。軽微な更新やバグ対応だけのご相談もどうぞ。",
    },
  ],

  contact: {
    email: "o2maroworks@gmail.com",
    note: "制作のご相談、見積もりのご依頼はこちらへ。",
  },
});
