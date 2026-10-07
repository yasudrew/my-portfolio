import { z } from "zod";

import type { ServiceId } from "@/content/services";

/**
 * The console's structure.
 *
 * The board leads with the two services (see `services.ts`), then the client
 * work and About side by side. Work is the wider of the pair: it is the other
 * half of the claim — an engineer who runs his own things *and* builds for
 * others — while About is where a visitor goes to decide whether to ask.
 *
 * Sound, Lab and Thought are the room behind it. They keep their own routes but
 * leave the board: they are reached from About, as the things made without a
 * brief, so they no longer compete with the work for the first screen.
 */
export const stageSchema = z.object({
  id: z.enum(["work", "sound", "lab", "thought", "about"]),
  label: z.string(),
  /** the short Japanese reading shown beside the label */
  jp: z.string(),
  /**
   * `board` — on the first screen, under the services
   * `play` — made without a brief, reached from About
   */
  group: z.enum(["board", "play"]),
  /** the one-line answer to "what is this and why" */
  lede: z.string(),
  /** the verb on each card in this stage — what the visitor is invited to do */
  action: z.string(),
  tags: z.array(z.string()).min(1),
  /**
   * What this stage is for, in the order it should appear.
   *
   * Doubles as the slot list inside the stage, so the board's glimpse and the
   * stage itself can never drift apart. Real entries replace these as they
   * land; until then this is what tells a visitor what the section covers.
   */
  holds: z.array(z.string()).min(1),
});

export type Stage = z.infer<typeof stageSchema>;
export type StageId = Stage["id"];
export type StageGroup = Stage["group"];

const RAW: readonly Stage[] = [
  {
    id: "work",
    label: "Work",
    jp: "受託開発",
    group: "board",
    lede: "デザイナーから受けて、実装・設計・CMS構築を担当した仕事。カンプに含まれない動きの設計は、毎回こちらで組み立てています。",
    action: "Open",
    tags: ["Web", "Tool", "Automation"],
    holds: ["HP構築", "ツール開発", "自動化系"],
  },
  {
    id: "sound",
    label: "Sound",
    jp: "曲制作",
    group: "play",
    lede: "頼まれていないのにつくっているもの。用途はなく、鳴っていること自体が目的です。ここでは再生が主役になります。",
    action: "Play",
    tags: ["Production", "Sound design"],
    holds: ["Track", "Sound design", "Collaboration"],
  },
  {
    id: "lab",
    label: "Lab",
    jp: "つくったもの",
    group: "play",
    lede: "仕事にはならないが、つくってみたもの。シェーダー、シミュレーション、使い道の分からない道具。",
    action: "Try",
    tags: ["Shader", "Simulation", "Demo"],
    holds: ["Shader", "Simulation", "Demo"],
  },
  {
    id: "thought",
    label: "Thought",
    jp: "記事",
    group: "play",
    lede: "考えていることの記録。技術の話も、そうでない話も、なぜつくるのかに繋がる範囲で。",
    action: "Read",
    tags: ["Essay", "Note"],
    holds: ["エンジニアリング", "教育", "人生", "音楽"],
  },
  {
    id: "about",
    label: "About",
    jp: "自己紹介",
    group: "board",
    lede: "何をする人で、どこまで引き受けて、どれくらいかかるのか。依頼を検討するときに要る情報と、仕事の外でつくっている曲・実験・記事への入口をまとめています。",
    action: "Open",
    tags: ["Profile", "Contact"],
    holds: ["Profile", "Playground", "Contact"],
  },
];

export const STAGES: readonly Stage[] = RAW.map((stage) => stageSchema.parse(stage));

export function stageById(id: string): Stage | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function stagesInGroup(group: StageGroup): readonly Stage[] {
  return STAGES.filter((stage) => stage.group === group);
}

/** Heading for the playground, now a section of About. */
export const PLAY_HEADING = { label: "Playground", jp: "遊び場" };

/** Everything that can hold the board's highlight. */
export type BoardId = ServiceId | "work" | "about";

/**
 * Which tile each arrow key leads to.
 *
 * Written out rather than derived: the board is a two-by-two of unequal
 * widths, and spelling out the adjacencies keeps movement obvious if the shape
 * changes again.
 */
export const NAV: Record<
  BoardId,
  Partial<Record<"left" | "right" | "up" | "down", BoardId>>
> = {
  tekutan: { right: "cognitive-traits", down: "work" },
  "cognitive-traits": { left: "tekutan", down: "about" },
  work: { up: "tekutan", right: "about" },
  about: { up: "cognitive-traits", left: "work" },
};
