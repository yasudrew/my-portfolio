import type { Metadata } from "next";

import { StageScreen } from "@/components/console/StageScreen";
import { TrackList } from "@/components/console/TrackList";

export const metadata: Metadata = { title: "Sound" };

export default function SoundPage() {
  return (
    <StageScreen id="sound">
      <TrackList />
    </StageScreen>
  );
}
