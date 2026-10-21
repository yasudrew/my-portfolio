import type { MetadataRoute } from "next";

import { THOUGHTS } from "@/content/thought";
import { WORKS } from "@/content/works";
import { absoluteUrl } from "@/lib/site";

// The site is a static export: without this the route is not written to out/.
export const dynamic = "force-static";

/** Every page that has its own route; the detail pages follow from the content. */
const PAGES = ["/", "/work", "/about", "/about/career", "/lab", "/sound", "/thought"] as const;

/**
 * No `lastModified`: the content files carry no dates, and stamping the build
 * time would tell crawlers every page changed on every deploy.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES,
    ...WORKS.map((work) => `/work/${work.slug}`),
    ...THOUGHTS.map((entry) => `/thought/${entry.slug}`),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
