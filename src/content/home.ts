import { z } from "zod";

/**
 * The introduction under the board.
 *
 * The board shows what is here; this is the word on who runs it, in plain
 * text, for a visitor who wants a sentence rather than a set of tiles.
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
