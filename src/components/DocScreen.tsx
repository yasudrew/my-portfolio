import { ViewTransition } from "react";

import { KeyGuide } from "@/components/console/KeyGuide";
import { StageEscape } from "@/components/console/StageEscape";
import { docPageById, type DocPageId } from "@/content/legal";

/**
 * The frame for the pages outside the console (privacy, contact).
 *
 * Laid out like a stage so moving between them does not feel like leaving the
 * site, but without the shared-element heading: nothing on the board turns
 * into these titles, so there is nothing to morph from.
 */
export function DocScreen({
  id,
  children,
}: {
  id: DocPageId;
  children: React.ReactNode;
}) {
  const page = docPageById(id);
  if (!page) throw new Error(`Unknown doc page: ${id}`);

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <StageEscape href="/" />

        <div className="mx-auto grid w-full max-w-shell gap-3 px-4 pt-7 md:px-9 md:pt-10">
          <h1 className="text-[clamp(1.6rem,4.4vw,2.6rem)] leading-tight font-extralight tracking-[-0.02em]">
            {page.jp}
          </h1>
          <p className="max-w-[46ch] text-[0.98rem] text-ink-dim">{page.lede}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-9 pb-10 md:px-9">
          <div className="mx-auto w-full max-w-shell">{children}</div>
        </div>

        <KeyGuide
          guides={[
            { key: "Esc", label: "Back" },
            { key: "Tab", label: "Browse" },
          ]}
        />
      </div>
    </ViewTransition>
  );
}
