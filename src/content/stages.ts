import { z } from "zod";

/**
 * The console's structure.
 *
 * Two sides — what was made to *function*, and what was made to *express* —
 * standing on one foundation: why any of it gets made at all. That split is the
 * answer to "so which one are you", and it only works if the site states it
 * structurally rather than listing job titles side by side.
 *
 * `about` is in this list for its route and metadata, but it is not a stage:
 * it is information about a person, not something they made, so it lives in the
 * HUD instead of on the board.
 */
export const stageSchema = z.object({
  id: z.enum(["works", "sound", "thought", "about"]),
  label: z.string(),
  /** the short Japanese reading shown beside the label */
  jp: z.string(),
  /**
   * `engineering` / `expression` — the two columns
   * `foundation`  — sits under both
   * `meta`        — not on the board at all
   */
  group: z.enum(["engineering", "expression", "foundation", "meta"]),
  /** the one-line answer to "what is this and why" */
  lede: z.string(),
  /** the verb on each card in this stage — what the visitor is invited to do */
  action: z.string(),
  tags: z.array(z.string()).min(1),
});

export type Stage = z.infer<typeof stageSchema>;
export type StageId = Stage["id"];
export type StageGroup = Stage["group"];

const RAW: readonly Stage[] = [
  {
    id: "works",
    label: "Works",
    jp: "制作物",
    group: "engineering",
    lede: "機能を果たすためにつくったもの。課題があり、手段を選び、結果が出た記録です。Webサイト、アプリケーション、社内ツール。",
    action: "Open",
    tags: ["Web", "App", "Tool"],
  },
  {
    id: "sound",
    label: "Sound",
    jp: "音楽",
    group: "expression",
    lede: "表現のためにつくったもの。用途はなく、鳴っていること自体が目的です。ここでは再生が主役になります。",
    action: "Play",
    tags: ["Production", "Sound design"],
  },
  {
    id: "thought",
    label: "Thought",
    jp: "思考",
    group: "foundation",
    lede: "機能と表現、その両方の根にあるもの。なぜつくるのか、つくることで何が起きるのかについての記述。",
    action: "Read",
    tags: ["Essay", "Note"],
  },
  {
    id: "about",
    label: "About",
    jp: "自己紹介",
    group: "meta",
    lede: "経歴、できること、大事にしていること。仕事の相談先としての情報もここに。",
    action: "Open",
    tags: ["Profile", "Contact"],
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

/** Headings for the two columns, and the strip beneath them. */
export const GROUP_LABELS: Record<
  Exclude<StageGroup, "meta">,
  { label: string; jp: string }
> = {
  engineering: { label: "Engineering", jp: "機能のために" },
  expression: { label: "Expression", jp: "表現のために" },
  foundation: { label: "Foundation", jp: "その根にあるもの" },
};

/**
 * Which stage each arrow key leads to.
 *
 * Written out rather than derived from an index: the board is two columns over
 * one strip, and spelling out the adjacencies keeps the movement obvious as the
 * shape changes. `thought`'s `up` is filled in at runtime with whichever column
 * the visitor came down from.
 */
export const NAV: Record<
  Exclude<StageId, "about">,
  Partial<Record<"left" | "right" | "up" | "down", StageId>>
> = {
  works: { right: "sound", down: "thought" },
  sound: { left: "works", down: "thought" },
  thought: { up: "works" },
};
