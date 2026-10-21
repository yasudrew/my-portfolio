import type { Metadata } from "next";

import { DocScreen } from "@/components/DocScreen";
import { PRIVACY } from "@/content/legal";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "marocreate が運営する maro-create.com と関連サービスでの、情報の扱い・Cookie・広告配信についての方針。",
};

export default function PrivacyPage() {
  return (
    <DocScreen id="privacy">
      <div className="grid max-w-2xl gap-10 pb-4">
        {PRIVACY.sections.map((section) => (
          <section
            key={section.heading}
            className="grid gap-4 border-t border-edge-soft pt-8 first:border-t-0 first:pt-0"
          >
            <h2 className="text-[1.05rem] font-normal tracking-tight text-ink">
              {section.heading}
            </h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 16)}
                className="text-[0.94rem] leading-relaxed text-ink-dim"
              >
                {paragraph}
              </p>
            ))}
            {section.links ? (
              <ul className="grid gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener"
                      className="text-[0.9rem] text-blue-lit underline-offset-[6px] transition-colors duration-200 hover:text-ink hover:underline"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className="border-t border-edge-soft pt-8 font-mono text-[0.66rem] tracking-[0.12em] text-ink-faint">
          {PRIVACY.history.join(" / ")}
        </p>
      </div>
    </DocScreen>
  );
}
