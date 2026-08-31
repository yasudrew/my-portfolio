import { z } from "zod";

/**
 * The console's structure.
 *
 * One main section and a playground, not two equal halves. An even split reads
 * as "which of these is he, then?"; a weighted one answers before the question
 * is asked — an engineer, who also makes things for the fun of it. The work is
 * the front door; Sound, Lab and Thought are the room behind it.
 *
 * `about` is here for its route and metadata but is not a stage: it is
 * information about a person, not something they made, so it lives in the HUD.
 */
export const stageSchema = z.object({
  id: z.enum(["work", "sound", "lab", "thought", "about"]),
  label: z.string(),
  /** the short Japanese reading shown beside the label */
  jp: z.string(),
  /**
   * `main` — the work, given the weight of the screen
   * `play` — made without a brief
   * `meta` — not on the board at all
   */
  group: z.enum(["main", "play", "meta"]),
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
    jp: "仕事",
    group: "main",
    lede: "依頼を受けてつくるもの。課題を聞き、手段を選び、動くものにして渡すまで。サイト構築から社内ツール、業務の自動化まで。",
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
    holds: ["Essay", "Note", "Reading"],
  },
  {
    id: "about",
    label: "About",
    jp: "自己紹介",
    group: "meta",
    lede: "経歴、できること、大事にしていること。仕事の相談先としての情報もここに。",
    action: "Open",
    tags: ["Profile", "Contact"],
    holds: ["Profile", "Skills", "Contact"],
  },
];

export const STAGES: readonly Stage[] = RAW.map((stage) => stageSchema.parse(stage));

/** The stages that appear on the board, in reading order. */
export const BOARD_STAGES: readonly Stage[] = STAGES.filter(
  (stage) => stage.group !== "meta",
);

export function stageById(id: string): Stage | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function stagesInGroup(group: StageGroup): readonly Stage[] {
  return STAGES.filter((stage) => stage.group === group);
}

/** Heading for the playground strip. The main section needs none — it is the work. */
export const PLAY_HEADING = { label: "Playground", jp: "遊び場" };

/**
 * Which stage each arrow key leads to.
 *
 * Written out rather than derived: the board is one wide panel over a row of
 * three, and spelling out the adjacencies keeps movement obvious as the shape
 * changes. `work`'s `down` and the row's `up` are filled in at runtime so the
 * visitor returns to whichever tile they came from.
 */
export const NAV: Record<
  Exclude<StageId, "about">,
  Partial<Record<"left" | "right" | "up" | "down", StageId>>
> = {
  work: { down: "sound" },
  sound: { up: "work", right: "lab" },
  lab: { up: "work", left: "sound", right: "thought" },
  thought: { up: "work", left: "lab" },
};
