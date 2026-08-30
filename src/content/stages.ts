import { z } from "zod";

/**
 * The five stages of the console.
 *
 * Order is the menu order, and the `id` is the route segment — `/works`,
 * `/sound`, and so on. Adding a stage means adding an entry here and a matching
 * `app/<id>/page.tsx`; nothing else needs to know the list.
 */
export const stageSchema = z.object({
  id: z.enum(["works", "sound", "visual", "thought", "about"]),
  label: z.string(),
  jp: z.string(),
  lede: z.string(),
  /** the verb on each card in this stage — what the visitor is invited to do */
  action: z.string(),
  tags: z.array(z.string()).min(1),
});

export type Stage = z.infer<typeof stageSchema>;
export type StageId = Stage["id"];

const RAW: readonly Stage[] = [
  {
    id: "works",
    label: "Works",
    jp: "制作物",
    lede: "設計から実装まで担当したWebサイト、アプリケーション、社内ツール。課題と、選んだ手段と、結果まで。",
    action: "Open",
    tags: ["Web", "App", "Tool"],
  },
  {
    id: "sound",
    label: "Sound",
    jp: "音楽",
    lede: "プロデュース、トラック制作、サウンドデザイン。ここでは再生が主役になります。",
    action: "Play",
    tags: ["Production", "Sound design"],
  },
  {
    id: "visual",
    label: "Visual",
    jp: "ビジュアル",
    lede: "グラフィック、モーション、キャラクター。唯一、画像そのものを主役にしてよい場所です。",
    action: "View",
    tags: ["Graphic", "Motion", "Character"],
  },
  {
    id: "thought",
    label: "Thought",
    jp: "思考",
    lede: "なぜ作るのか。技術と音楽と哲学が、自分の中でどう地続きなのかについての記述。",
    action: "Read",
    tags: ["Essay", "Note"],
  },
  {
    id: "about",
    label: "About",
    jp: "自己紹介",
    lede: "経歴、できること、大事にしていること。仕事の相談先としての情報もここに。",
    action: "Open",
    tags: ["Profile", "Contact"],
  },
];

export const STAGES: readonly Stage[] = RAW.map((stage) => stageSchema.parse(stage));

export function stageById(id: string): Stage | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((stage) => stage.id === id);
}
