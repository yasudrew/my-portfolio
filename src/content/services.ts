import { z } from "zod";

/**
 * The services run under this name — the front of the board.
 *
 * These are put ahead of the client work on purpose. A designer looking for an
 * implementer learns more from two things that are live and kept running than
 * from a list of what was handed over: shipping is the claim, operating is the
 * proof. The client work sits right underneath, so the reading is "makes his
 * own, and builds for others too" rather than one or the other.
 */
export const serviceSchema = z.object({
  id: z.enum(["tekutan", "cognitive-traits"]),
  name: z.string(),
  /** the reading or alternate name shown beside it */
  jp: z.string(),
  tagline: z.string(),
  /** the one-line answer to "what is this", shown under the board */
  lede: z.string(),
  /** three words on what it covers, laid out like the work's pillars */
  points: z.array(z.string()).length(3),
  url: z.string().url(),
  /** the service's own OG image, kept here so the board needs no network */
  thumb: z.string().startsWith("/"),
  /** the thumbnail's paper colour, so letterboxing reads as part of the image */
  thumbBg: z.string().regex(/^#[0-9a-f]{6}$/),
  status: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;
export type ServiceId = Service["id"];

const RAW: readonly Service[] = [
  {
    id: "tekutan",
    name: "tekutan",
    jp: "テクタン",
    tagline: "あなたのためのITパートナー",
    lede: "個人で事業をしている方や少人数のチームに向けて、月額でITまわりを見るサービス。ホームページの更新から、業務の自動化やAIの使いどころまで。月4,980円から、初回のIT健康診断は無料です。",
    points: ["月額のIT相談", "サイトの更新", "自動化・AI活用"],
    url: "https://tekutan.maro-create.com/",
    thumb: "/services/tekutan.webp",
    thumbBg: "#fbf8f1",
    status: "運用中",
  },
  {
    id: "cognitive-traits",
    name: "認知特性診断",
    jp: "Cognitive Style",
    tagline: "30問でわかる、覚え方と考え方のクセ",
    lede: "見て覚えるか、聞いて覚えるか、言葉で考えるか。人によって違う情報の受け取り方を、30問で6つのタイプに分けて示す無料の診断です。タイプ別の学び方や伝え方の記事も書いています。",
    points: ["6タイプの診断", "相性診断", "タイプ別の記事"],
    url: "https://cognitive-traits.maro-create.com/",
    thumb: "/services/cognitive-traits.webp",
    thumbBg: "#fafaf7",
    status: "運用中",
  },
];

export const SERVICES: readonly Service[] = RAW.map((service) =>
  serviceSchema.parse(service),
);
