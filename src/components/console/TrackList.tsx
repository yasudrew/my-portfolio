"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatDuration, TRACKS, type Track } from "@/content/tracks";

/**
 * The Sound stage.
 *
 * The site never makes noise on its own — this is the one place audio exists,
 * and only after the visitor asks for it. A single `<audio>` element is reused
 * for every track so two can never overlap.
 */
export function TrackList() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const current = TRACKS.find((track) => track.slug === currentSlug) ?? null;

  const toggle = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentSlug === track.slug) {
        if (audio.paused) void audio.play();
        else audio.pause();
        return;
      }

      setCurrentSlug(track.slug);
      setElapsed(0);
      audio.src = track.src;
      void audio.play();
    },
    [currentSlug],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setElapsed(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setElapsed(0);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Leaving the stage stops playback — audio outliving its page is the exact
  // thing that makes a site feel like it is doing something behind your back.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  return (
    <div className="grid gap-6">
      <audio ref={audioRef} preload="none" />

      <ul className="grid gap-px overflow-hidden rounded-sm border border-edge-soft bg-edge-soft">
        {TRACKS.map((track, index) => {
          const isCurrent = track.slug === currentSlug;
          const ratio = isCurrent ? Math.min(1, elapsed / track.duration) : 0;

          return (
            <li key={track.slug} className="relative bg-ground">
              <button
                type="button"
                onClick={() => toggle(track)}
                aria-pressed={isCurrent && playing}
                className="relative grid w-full grid-cols-[2.4rem_1fr_auto] items-center gap-4 px-4 py-4 text-left transition-colors duration-200 hover:bg-surface/70"
              >
                {/* progress sits behind the row, not as a separate widget */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 bg-blue/12 transition-[width] duration-200 ease-linear"
                  style={{ width: `${ratio * 100}%` }}
                />

                <span
                  className={[
                    "relative font-mono text-[0.68rem] tracking-[0.1em] tabular-nums",
                    isCurrent ? "text-amber" : "text-edge",
                  ].join(" ")}
                >
                  {isCurrent && playing ? "❚❚" : String(index + 1).padStart(2, "0")}
                </span>

                <span className="relative grid gap-0.5">
                  <span
                    className={[
                      "text-[1.05rem] tracking-tight",
                      isCurrent ? "font-normal text-ink" : "font-light text-ink-dim",
                    ].join(" ")}
                  >
                    {track.title}
                  </span>
                  <span className="font-mono text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase">
                    {track.role}
                  </span>
                </span>

                <span className="relative font-mono text-[0.7rem] text-ink-faint tabular-nums">
                  {isCurrent && elapsed > 0
                    ? `${formatDuration(elapsed)} / ${formatDuration(track.duration)}`
                    : formatDuration(track.duration)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[0.66rem] tracking-[0.12em] text-ink-faint uppercase">
        {current
          ? `Now ${playing ? "playing" : "paused"} — ${current.title}`
          : `${TRACKS.length} tracks · press a row to play`}
      </p>
    </div>
  );
}
