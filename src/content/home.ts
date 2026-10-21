import { z } from "zod";

/**
 * The introduction under the title card.
 *
 * The title card is a closed door, and a door says nothing about the house: a
 * visitor who scrolls instead of clicking, or a reader without JavaScript,
 * would otherwise find no word on who runs this site. This is that word, in
 * plain text and in plain view below the first screen.
 *
 * Only the opening is written here. The services and the Work/About blurbs
 * below it are read from `services.ts` and `stages.ts`, so the board and this
 * section can never describe them differently.
 */
export const homeSchema = z.object({
  heading: z.string(),
  intro: z.array(z.string()).min(1),
});

export const HOME = homeSchema.parse({
  heading: "marocreate について",
  intro: [
    "ろまです。marocreate という屋号で、Webサイトの実装と、小さなWebサービスの運営をしています。",
    "受託では、デザイナーからデザインを受け取り、実装・設計・CMS構築を担当します。カンプに描かれていない部分——何がどう動くか、どこで間を取るか——を組み立てるところまでが仕事です。",
    "自分でも2つのサービスを運営しています。公開して終わりにせず、使われ方を見ながら手を入れ続けています。",
  ],
});
