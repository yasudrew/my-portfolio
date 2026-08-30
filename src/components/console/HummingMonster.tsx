/**
 * The guide.
 *
 * Stand-in line art until the traced paths of the real Humming Monster land in
 * `public/brand/`. Stroked in `currentColor` so it takes the amber from the
 * character's own artwork with a colour class rather than a second asset.
 *
 * It reacts by being remounted — the menu passes a `key` that changes with the
 * selection, which restarts the CSS animation. No state, no re-render.
 */
export function HummingMonster({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" fill="none" aria-hidden="true">
      <g className="guide-note">
        <path d="M12 26v-12l10-3v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="9" cy="27" r="3.5" fill="currentColor" />
        <circle cx="19" cy="24" r="3.5" fill="currentColor" />
      </g>
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 62c0-13 8-23 20-23s20 10 20 23" />
        <path d="M40 62c-2 8 4 16 20 16s22-8 20-16" />
        <path d="M36 44a24 24 0 0 1 48 0" />
        <path d="M34 60v22M86 60v22" />
        <path d="M52 56h8M62 56h8" />
        <path d="M52 68c4 3 12 3 16 0" />
      </g>
      <rect x="28" y="42" width="12" height="18" rx="5" fill="currentColor" />
      <rect x="80" y="42" width="12" height="18" rx="5" fill="currentColor" />
    </svg>
  );
}
