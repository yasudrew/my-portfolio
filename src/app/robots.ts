import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

// The site is a static export: without this the route is not written to out/.
export const dynamic = "force-static";

/**
 * Open to everyone; the file exists to point crawlers at the sitemap.
 *
 * Cloudflare's managed robots.txt adds its own lines in front of this in
 * production, so check the served file after a deploy rather than this one.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
