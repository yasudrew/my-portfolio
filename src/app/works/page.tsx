import type { Metadata } from "next";

import { StageCard } from "@/components/console/StageCard";
import { StageScreen } from "@/components/console/StageScreen";
import { stageById } from "@/content/stages";

export const metadata: Metadata = { title: "Works" };

/** Structure first, content later — each slot is a real entry waiting to land. */
const SLOTS = ["Web site", "Web application", "Internal tool", "Client work", "Experiment"];

export default function WorksPage() {
  const stage = stageById("works")!;

  return (
    <StageScreen id="works">
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
