/**
 * Where the site lives.
 *
 * Crawlers need absolute URLs for the OG card, the sitemap and robots.txt, and
 * all three must agree. NEXT_PUBLIC_SITE_URL is set in the host's build
 * settings; production builds fall back to the real domain and the dev server
 * to localhost so local previews keep resolving.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? "https://maro-create.com" : "http://localhost:3000"),
);

/** An absolute URL for a path on this site, without a trailing slash. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href.replace(/\/$/, "");
}
