import { ViewTransition } from "react";

import { KeyGuide } from "@/components/console/KeyGuide";
import { StageEscape } from "@/components/console/StageEscape";
import { stageById, type StageId } from "@/content/stages";

/**
 * The frame every stage shares.
 *
 * The heading is the other half of the shared-element pair started in the menu:
 * the row the visitor picked travels up here and becomes the title, so the
 * navigation reads as one object moving rather than two screens swapping.
 */
export function StageScreen({
  id,
  children,
}: {
  id: StageId;
  children: React.ReactNode;
}) {
  const stage = stageById(id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <StageEscape />

        <div className="grid gap-2 px-4 pt-2 md:px-9">
          <ViewTransition name={`stage-${stage.id}`} share="stage-morph" default="none">
            <h1 className="text-[clamp(1.8rem,5vw,3rem)] leading-none font-extralight tracking-[-0.03em]">
              {stage.label}
            </h1>
          </ViewTransition>
          <p className="max-w-[46ch] text-[0.98rem] text-ink-dim">{stage.lede}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8 md:px-9">
          {children}
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
