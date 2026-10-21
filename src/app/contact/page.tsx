import type { Metadata } from "next";
import Link from "next/link";

import { DocScreen } from "@/components/DocScreen";
import { OPERATOR } from "@/content/legal";

export const metadata: Metadata = {
  title: "お問い合わせ・運営者情報",
  description: "maro-create.com を運営する marocreate（ろま）の運営者情報と連絡先。",
};

export default function ContactPage() {
  return (
    <DocScreen id="contact">
      <div className="grid max-w-2xl gap-10 pb-4">
        <section className="grid gap-4">
          <h2 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase">
            連絡先
          </h2>
          <a
            href={`mailto:${OPERATOR.email}`}
            className="justify-self-start text-[clamp(1.1rem,3.5vw,1.5rem)] font-light tracking-tight text-blue-lit underline-offset-[6px] transition-colors duration-200 hover:text-ink hover:underline"
          >
            {OPERATOR.email}
          </a>
          <p className="text-[0.94rem] leading-relaxed text-ink-dim">{OPERATOR.note}</p>
        </section>

        <section className="grid gap-5 border-t border-edge-soft pt-8">
          <h2 className="font-mono text-[0.66rem] tracking-[0.16em] text-ink-faint uppercase">
            運営者情報
          </h2>
          <dl className="grid gap-4">
            {OPERATOR.rows.map((row) => (
              <div key={row.label} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint sm:pt-1">
                  {row.label}
                </dt>
                <dd className="text-[0.94rem] leading-relaxed text-ink-dim">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="border-t border-edge-soft pt-8 text-[0.88rem] leading-relaxed text-ink-faint">
          いただいた情報の扱いは
          <Link
            href="/privacy"
            transitionTypes={["nav-forward"]}
            className="mx-1 text-blue-lit underline-offset-[6px] transition-colors duration-200 hover:text-ink hover:underline"
          >
            プライバシーポリシー
          </Link>
          をご覧ください。
        </p>
      </div>
    </DocScreen>
  );
}
