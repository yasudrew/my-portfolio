import type { Metadata } from "next";

import { StageCard } from "@/components/console/StageCard";
import { StageScreen } from "@/components/console/StageScreen";
import { stageById } from "@/content/stages";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const stage = stageById("about")!;

  return (
    <StageScreen id="about">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] content-start gap-3.5">
        {stage.holds.map((name, index) => (
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
