import type { Metadata } from "next";

import { StageCard } from "@/components/console/StageCard";
import { StageScreen } from "@/components/console/StageScreen";
import { stageById } from "@/content/stages";

export const metadata: Metadata = { title: "Visual" };

/** Structure first, content later — each slot is a real entry waiting to land. */
const SLOTS = ["Graphic", "Motion", "Character", "Series"];

export default function VisualPage() {
  const stage = stageById("visual")!;

  return (
    <StageScreen id="visual">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] content-start gap-3.5">
        {SLOTS.map((name, index) => (
          <StageCard
            key={name + index}
            index={index}
            name={name}
            action={stage.action}
            pending
          />
        ))}
      </div>
    </StageScreen>
  );
}
