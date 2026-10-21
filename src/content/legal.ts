import { z } from "zod";

import { ABOUT } from "@/content/about";
import { SERVICES } from "@/content/services";

/**
 * The pages that are not part of the console: who runs this, and what happens
 * to a visitor's data.
 *
 * The privacy policy describes what the code actually does, not what a
 * template says sites usually do. As of writing this site runs no analytics,
 * sets no cookies of its own and carries no ads; the ads run on the services
 * under the subdomains. If any of that changes, this file changes with it.
 *
 * The operator is named by the brand and the handle only. The real name stays
 * on the career page, where it is part of the record rather than a contact.
 */

export const docPageSchema = z.object({
  id: z.enum(["privacy", "contact"]),
  label: z.string(),
  jp: z.string(),
  lede: z.string(),
});

export type DocPage = z.infer<typeof docPageSchema>;
export type DocPageId = DocPage["id"];

const RAW_PAGES: readonly DocPage[] = [
  {
    id: "privacy",
    label: "Privacy",
    jp: "プライバシーポリシー",
    lede: "このサイトと関連サービスで、閲覧する方の情報をどう扱うか。",
  },
  {
    id: "contact",
    label: "Contact",
    jp: "お問い合わせ・運営者情報",
    lede: "このサイトを運営している者と、連絡のしかた。",
  },
];

export const DOC_PAGES: readonly DocPage[] = RAW_PAGES.map((page) =>
  docPageSchema.parse(page),
);

export function docPageById(id: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.id === id);
}

const linkSchema = z.object({ label: z.string(), href: z.string().url() });

export const operatorSchema = z.object({
  rows: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  email: z.string().email(),
  note: z.string(),
});

export const OPERATOR = operatorSchema.parse({
  rows: [
    { label: "屋号", value: ABOUT.brand },
    { label: "運営者", value: ABOUT.name },
    {
      label: "事業内容",
      value: `Webサイトの実装・設計・CMS構築（デザイナーからの受託）、${SERVICES.map((service) => service.name).join("・")}の運営`,
    },
  ],
  email: ABOUT.contact.email,
  note: "制作のご相談や見積もりのご依頼、運営しているサービスについてのお問い合わせ、掲載内容についてのご連絡は、メールでお願いします。",
});

export const policySectionSchema = z.object({
  heading: z.string(),
  body: z.array(z.string()).min(1),
  links: z.array(linkSchema).optional(),
});

export type PolicySection = z.infer<typeof policySectionSchema>;

export const privacySchema = z.object({
  sections: z.array(policySectionSchema).min(1),
  /** shown at the foot, newest last */
  history: z.array(z.string()).min(1),
});

const cognitiveTraits = SERVICES.find((service) => service.id === "cognitive-traits");
if (!cognitiveTraits) throw new Error("cognitive-traits missing from services.ts");

export const PRIVACY = privacySchema.parse({
  sections: [
    {
      heading: "適用範囲",
      body: [
        `このポリシーは、${ABOUT.brand}（以下「当方」）が運営する maro-create.com と、そのサブドメインで提供しているサービス（${SERVICES.map((service) => service.name).join("、")}など）に適用します。`,
        "サービスごとに個別のプライバシーポリシーを定めている場合は、そちらもあわせてご確認ください。",
      ],
      links: [
        {
          label: `${cognitiveTraits.name}のプライバシーポリシー`,
          href: new URL("/ja/privacy", cognitiveTraits.url).href,
        },
      ],
    },
    {
      heading: "取得する情報と利用目的",
      body: [
        "お問い合わせのメールでいただいたお名前・メールアドレス・ご相談の内容は、返信とご依頼への対応のためにだけ使います。",
        "このサイトには、閲覧する方の情報を集めるためのフォームや会員機能はありません。",
      ],
    },
    {
      heading: "アクセス解析とCookie",
      body: [
        "maro-create.com では、現在アクセス解析ツールを使っていません。このサイト自身がCookieを保存することもありません。",
        "サブドメインのサービスでアクセス解析を使う場合は、各サービスのプライバシーポリシーに記載します。",
      ],
    },
    {
      heading: "配信事業者による処理",
      body: [
        "このサイトは Cloudflare, Inc. のサービスで配信しています。配信の過程で、IPアドレス、ブラウザの種類、アクセスした日時などが Cloudflare によって処理されます。当方がこれらを個人の特定に使うことはありません。",
      ],
      links: [
        {
          label: "Cloudflare のプライバシーポリシー",
          href: "https://www.cloudflare.com/privacypolicy/",
        },
      ],
    },
    {
      heading: "広告の配信について",
      body: [
        "当方の関連サービス（サブドメイン）では、第三者配信の広告サービス「Google AdSense」を利用しています。maro-create.com のこのサイトには広告を掲載していません。",
        "Google などの第三者配信事業者は、Cookie を使用して、利用者が当方のサイトや他のサイトに過去にアクセスした際の情報に基づいて広告を配信します。",
        "Google が広告 Cookie を使用することにより、Google とそのパートナーは、当方のサイトや他のサイトへのアクセス情報に基づいて、利用者に適切な広告を表示できます。",
        "パーソナライズ広告は、Google の広告設定で無効にできます。また、aboutads.info では、パーソナライズ広告に使われる第三者配信事業者の Cookie を無効にできます。ブラウザの設定で Cookie を無効にすることもできます。",
      ],
      links: [
        { label: "Google の広告設定", href: "https://adssettings.google.com/" },
        { label: "aboutads.info", href: "https://www.aboutads.info/" },
        {
          label: "Google によるデータの使用について",
          href: "https://policies.google.com/technologies/partner-sites",
        },
      ],
    },
    {
      heading: "第三者への提供",
      body: [
        "法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。",
      ],
    },
    {
      heading: "開示・訂正・削除のご依頼",
      body: [
        `ご自身の情報の開示・訂正・削除をご希望の場合は、${ABOUT.contact.email} までご連絡ください。`,
      ],
    },
    {
      heading: "免責事項",
      body: [
        "このサイトの情報はできるだけ正確に保つようにしていますが、内容の正確さや安全性を保証するものではありません。",
        "このサイトからリンクしている外部のサイトで生じたことについて、当方は責任を負いかねます。",
      ],
    },
    {
      heading: "著作権",
      body: [
        "このサイトの文章・画像・音源の著作権は、当方または各権利者に帰属します。無断での転載はご遠慮ください。",
      ],
    },
    {
      heading: "改定",
      body: [
        "このポリシーは、必要に応じて改定します。改定した場合は、このページでお知らせします。",
      ],
    },
  ],
  history: ["2026年10月21日 制定"],
});
