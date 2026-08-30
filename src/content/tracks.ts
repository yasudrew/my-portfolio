import { z } from "zod";

/**
 * Music, the one medium on this site that is already real.
 *
 * Durations are the measured file lengths, not estimates — they are shown to
 * the visitor before they commit to pressing play.
 */
export const trackSchema = z.object({
  slug: z.string(),
  title: z.string(),
  /** path under /public */
  src: z.string(),
  /** seconds */
  duration: z.number().positive(),
  year: z.string(),
  role: z.string(),
});

export type Track = z.infer<typeof trackSchema>;

const RAW: readonly Track[] = [
  {
    slug: "tsuki-to-waltz",
    title: "月とワルツ",
    src: "/audio/tsuki-to-waltz.mp3",
    duration: 277.99,
    year: "2025",
    role: "Composition / Arrangement / Mix",
  },
  {
    slug: "boots",
    title: "ブーツ",
    src: "/audio/boots.mp3",
    duration: 256.68,
    year: "2025",
    role: "Composition / Arrangement / Mix",
  },
  {
    slug: "somaru",
    title: "染まる",
    src: "/audio/somaru.mp3",
    duration: 254.57,
    year: "2025",
    role: "Composition / Arrangement / Mix",
  },
  {
    slug: "basutei-de-matsu",
    title: "バス停で待つ",
    src: "/audio/basutei-de-matsu.mp3",
    duration: 234.41,
    year: "2025",
    role: "Composition / Arrangement / Mix",
  },
  {
    slug: "neon",
    title: "Neon",
    src: "/audio/neon.mp3",
    duration: 121.75,
    year: "2025",
    role: "Composition / Arrangement / Mix",
  },
];

export const TRACKS: readonly Track[] = RAW.map((track) => trackSchema.parse(track));

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}
