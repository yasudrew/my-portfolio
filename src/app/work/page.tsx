import type { Metadata } from "next";

import { StageScreen } from "@/components/console/StageScreen";
import { WorkList } from "@/components/console/WorkList";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <StageScreen id="work">
      <WorkList />
    </StageScreen>
  );
}
