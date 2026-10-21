import { ViewTransition } from "react";

import { HomeIntro } from "@/components/home/HomeIntro";
import { StageMenu } from "@/components/console/StageMenu";

export default function MenuPage() {
  return (
    // The wrapper lives in the page, not the layout: layouts persist across
    // navigation, so enter/exit would never fire from there.
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* StageMenu holds the first screen; the introduction waits below it */}
        <StageMenu />
        <HomeIntro />
      </div>
    </ViewTransition>
  );
}
