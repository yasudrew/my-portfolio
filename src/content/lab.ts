import { z } from "zod";

/**
 * The playground, written to be taken rather than admired.
 *
 * A Work entry answers "can this person be trusted with a job". A Lab entry
 * answers "can I use this". So each one names what is actually on offer —
 * the code, a prompt, something to poke at — instead of describing an effect
 * the reader can already see.
 *
 * `status` carries the shelved pieces on purpose. Half of this list is work
 * that lost an argument with the design, and a shelf of those is a better
 * answer to "how much do you build" than a row of finished things.
 */
export const labSchema = z.object({
  slug: z.string(),
  title: z.string(),
  /** what it is, in the vocabulary of the stage's tags */
  kind: z.enum(["Shader", "Simulation", "Demo", "Prompt"]),
  /** `live` — running somewhere on this site. `shelved` — built, then cut */
  status: z.enum(["live", "shelved"]),
  /** one line, from the point of view of someone who might want it */
  lede: z.string(),
  /** paragraphs, in order */
  body: z.array(z.string()).min(1),
  /** where it lives in this repo — a path now, a link once the source is out */
  source: z.string(),
  /** what a visitor can leave with */
  takeaways: z.array(z.enum(["Code", "Prompt", "Demo"])).min(1),
});

export type LabEntry = z.infer<typeof labSchema>;

const RAW: readonly LabEntry[] = [
  {
    slug: "fluid-solver",
    title: "Fluid Solver",
    kind: "Simulation",
    status: "live",
    lede: "この行にカーソルを置くと、背景がこれに変わります。",
    body: [
      "Stable Fluids をそのまま実装したもの。移流、カール、渦度の閉じ込め、発散、ヤコビ法による圧力投影、勾配減算まで一通り入っています。速度場と染料場をピンポンで回す構成です。",
      "解像度も圧力の反復回数も渦度の強さも外から渡せるので、重さと見た目のバランスは呼び出す側で決められます。",
      "もともとはこのサイトの扉絵の候補でした。常時動かすには重すぎて落としたのですが、捨てるには惜しかったので、この行の上にいるあいだだけ背景を明け渡す形で戻しています。マウスを動かすとかき混ざります。",
    ],
    source: "src/gl/fluid/",
    takeaways: ["Code", "Demo"],
  },
  {
    slug: "curl-flow",
    title: "Curl Flow",
    kind: "Simulation",
    status: "live",
    lede: "22000個の粒が、渦の場に乗って流れる。",
    body: [
      "ノイズをそのまま速度として使うと、粒が一箇所に溜まります。代わりにノイズを高さの地図とみなして、その勾配を90度回したものを速度にしています。こうすると発散がゼロになる、つまり湧き出しも吸い込みも原理的に存在しないので、散らし直す処理が要りません。",
      "履歴を持っていません。粒の位置は毎フレーム、種と時計だけから計算し直しています。前の位置を覚えておくほうが計算は軽いのですが、覚えないぶん、止めても再開しても何も壊れません。Labの背景のように出たり消えたりするものには、この方が向いています。",
      "粒ごとに寿命があって、消える瞬間と生まれる瞬間はフェードします。そうしないと画面のあちこちで粒が点滅します。",
    ],
    source: "src/gl/scenes/lab/CurlFlow.tsx",
    takeaways: ["Code", "Demo"],
  },
  {
    slug: "domain-warp",
    title: "Domain Warp",
    kind: "Shader",
    status: "live",
    lede: "ノイズを、ノイズで歪めた座標から引く。",
    body: [
      "やっていることは一行です。ノイズを引く座標に、別のノイズの出力を足す。それだけで、ただの雲だったものが折り重なった襞になります。ここではそれを二段重ねています。",
      "バッファを一枚も使いません。レンダーターゲットも履歴もなく、ピクセルごとに18回ノイズを引いて終わりです。この一覧で一番軽いものが、たぶん一番それらしく見える。",
      "上の二つと並べているのはそのためです。流体は圧力を解くのに何枚もバッファが要り、粒の流れは22000個ぶんの積分を毎フレーム回している。こちらは何も持ちません。同じくらい動いて見えるのに、値段が二桁違います。",
    ],
    source: "src/gl/scenes/lab/DomainWarp.tsx",
    takeaways: ["Code", "Demo"],
  },
  {
    slug: "logo-disperse",
    title: "Logo Disperse",
    kind: "Shader",
    status: "live",
    lede: "画像を粒子に分解して散らす。",
    body: [
      "扉絵からメニューへ移るときに動いているものです。ロゴのビットマップを一定間隔で走査して、不透明な画素だけを粒子にしています。透明なところからは粒子が出ないので、形がそのまま崩れていきます。",
      "ロゴ自体はWebGLではなく本物の img のままです。alt が要るし、読み込みはブラウザに任せたいので。散る瞬間に画面上の位置だけを粒子側へ渡していて、二つの層が共有しているのはその座標だけです。",
      "画像として正しいことと、壊れて見えることを両立させるための作りです。",
    ],
    source: "src/gl/scenes/LogoDisperse.tsx",
    takeaways: ["Code", "Demo"],
  },
  {
    slug: "lattice-field",
    title: "Lattice Field",
    kind: "Shader",
    status: "live",
    lede: "カーソルに合わせて沈む格子の背景。",
    body: [
      "この盤面の後ろで動いているものです。整列した格子がカーソルの周りだけ沈み、選択中の項目を追って横に淡い帯が流れます。画面の構造を、背景でもう一度なぞっている感じです。",
      "格子も帯も揺らぎも、全部ひとつのフラグメントシェーダーで描いています。背景ぜんぶでドローコール1回です。",
      "落ち込みの減衰は二乗ではなく三乗にしています。効きはじめが遅くなって、カーソルが格子を押しのけるのではなく、格子がカーソルに気づく程度の動きになります。",
    ],
    source: "src/gl/scenes/LatticeField.tsx",
    takeaways: ["Code", "Demo"],
  },
  {
    slug: "studio-environment",
    title: "Studio Environment",
    kind: "Shader",
    status: "shelved",
    lede: "HDR画像を読み込まずに、金属を光らせる。",
    body: [
      "反射に映り込ませる環境マップを、外部の画像を取りに行かずにその場で作ります。グラデーションの背景と光源をシーンに組んで、PMREM に通すだけです。読み込みはゼロで、色や光の位置はコードから変えられます。",
      "three.js で金属っぽい質感を出そうとすると、たいてい数MBのHDRを読むことになります。それが嫌で書いたものです。",
      "これを使っていた扉絵ごと落ちたので、単体で残っています。",
    ],
    source: "src/gl/archive/env/studioEnvironment.ts",
    takeaways: ["Code"],
  },
  {
    slug: "hero-object",
    title: "Hero Object",
    kind: "Shader",
    status: "shelved",
    lede: "ノイズで歪みつづける球。ポインタのほうへ少し傾く。",
    body: [
      "最初の扉絵です。球の表面を simplex ノイズで押し出して、ゆっくり回しながらポインタの方向へわずかに傾けています。端末の性能に応じて分割数を落とす作りにしてあります。",
      "見た目は悪くなかったのですが、これを置いても「何のサイトか」が一切伝わらないので捨てました。",
    ],
    source: "src/gl/archive/HeroObject.tsx",
    takeaways: ["Code"],
  },
];

export const LAB: readonly LabEntry[] = RAW.map((entry) => labSchema.parse(entry));

/** How each status reads on the card. */
export const STATUS_LABEL: Record<LabEntry["status"], string> = {
  live: "このサイトで稼働中",
  shelved: "お蔵入り",
};
