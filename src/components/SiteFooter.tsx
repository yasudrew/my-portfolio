import Link from "next/link";

import { ABOUT } from "@/content/about";
import { DOC_PAGES } from "@/content/legal";
import { SERVICES } from "@/content/services";
import { stageById } from "@/content/stages";

/** Work and About, in the order the board shows them. */
const STAGE_LINKS = (["work", "about"] as const).map((id) => {
  const stage = stageById(id);
  if (!stage) throw new Error(`Footer stage missing from stages.ts: ${id}`);
  return { href: `/${id}`, label: stage.label };
});

const linkClass =
  "text-ink-faint transition-colors duration-200 hover:text-blue-lit";

/**
 * The site-wide footer: every page links to the services, the contact details
 * and the privacy policy from here.
 *
 * It sits outside the full-height console frame, so on the board and the title
 * card it waits below the first screen rather than taking room from it.
 */
export function SiteFooter() {
  return (
    // data-own-keys: on the home page the console's key handling stays out of here
    <footer data-own-keys className="border-t border-edge-soft px-4 pt-6 pb-8 md:px-9">
      <div className="mx-auto grid w-full max-w-shell gap-4 font-mono text-[0.68rem] tracking-[0.1em]">
        <nav aria-label="サイト内のリンク" className="flex flex-wrap gap-x-6 gap-y-2">
          {STAGE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
          {SERVICES.map((service) => (
            <a
              key={service.id}
              href={service.url}
              target="_blank"
              rel="noopener"
              className={linkClass}
            >
              {service.name} ↗
            </a>
          ))}
          {DOC_PAGES.map((page) => (
            <Link key={page.id} href={`/${page.id}`} className={linkClass}>
              {page.jp}
            </Link>
          ))}
        </nav>
        <p className="text-ink-faint">© {ABOUT.brand}</p>
      </div>
    </footer>
  );
}
