/**
 * Brand mark.
 *
 * Stand-in geometry until the real marocreate SVG is dropped into
 * `public/brand/`. Drawn with `currentColor` so the knocked-out white version
 * is just a colour change, not a second asset.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11 3h10a8 8 0 0 1 6.9 12L23 24a4 4 0 0 1-3.5 2H11a8 8 0 0 1-6.9-12L9 5a4 4 0 0 1 3.5-2Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M13 23V13.5A3.5 3.5 0 0 1 16.5 10H20a3 3 0 0 1 0 6h-4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
