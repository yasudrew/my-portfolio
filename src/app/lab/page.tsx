import type { Metadata } from "next";

import { LabList } from "@/components/console/LabList";
import { StageScreen } from "@/components/console/StageScreen";

export const metadata: Metadata = { title: "Lab" };

export default function LabPage() {
  return (
    <StageScreen id="lab">
      <LabList />
    </StageScreen>
  );
}
