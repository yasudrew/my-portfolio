#!/usr/bin/env python3
"""Render the site's Open Graph card and write it to src/app/opengraph-image.png.

Usage:
    npm run og

Built as a screenshot rather than with next/og on purpose. The card carries
Japanese text and the brand mark, and headless Chrome already has both the
fonts and the SVG handling for that — generating it at build time would mean
shipping a font file just to draw four words.

Requires Google Chrome.
"""

from __future__ import annotations

import base64
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"
OUT = ROOT / "src" / "app" / "opengraph-image.png"

CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

SIZE = (1200, 630)

# Straight from globals.css and the character's own artwork.
GROUND = "#080b1a"
EDGE = "#22305c"
INK_FAINT = "#55648f"
BLUE_DEEP = "#2b4fb0"
AMBER = "#f5d149"

HEADLINE = "実装 / 設計 / CMS構築"


def build_html() -> str:
    monster = (BRAND / "humming_monster.svg").read_text(encoding="utf-8")
    logo = base64.b64encode((BRAND / "logo.png").read_bytes()).decode()

    return f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&family=Noto+Sans+JP:wght@300;400&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: {SIZE[0]}px; height: {SIZE[1]}px;
    background: {GROUND};
    font-family: "JetBrains Mono", "Noto Sans JP", sans-serif;
    overflow: hidden; position: relative;
  }}
  /* the lattice from the site's background, held still */
  .lattice {{
    position: absolute; inset: 0;
    background-image: radial-gradient({EDGE} 1.4px, transparent 1.4px);
    background-size: 30px 30px;
    opacity: 0.55;
  }}
  .glow {{
    position: absolute; left: -12%; bottom: -38%;
    width: 780px; height: 780px; border-radius: 50%;
    background: radial-gradient(circle, {BLUE_DEEP}55 0%, transparent 68%);
  }}
  .frame {{
    position: absolute; inset: 34px;
    border: 1px solid {EDGE}; border-radius: 4px;
  }}
  .stack {{
    position: absolute; left: 92px; top: 52%; transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 34px; z-index: 2;
  }}
  .logo {{ width: 470px; display: block; }}
  .headline {{
    font-size: 27px; font-weight: 400; letter-spacing: 0.14em;
    color: {INK_FAINT}; font-family: "Noto Sans JP", sans-serif;
  }}
  /* cropped by the lower edge on purpose: the guide is leaning into frame,
     not posed in it, and a whole character would out-shout the wordmark */
  .monster {{
    position: absolute; right: 88px; bottom: -26px;
    width: 470px; z-index: 1;
  }}
  .monster svg {{ width: 100%; height: auto; display: block; }}
  .monster svg [fill="black"] {{ fill: {AMBER}; }}
  .monster svg [stroke="black"] {{ stroke: {AMBER}; }}
</style></head>
<body>
  <div class="lattice"></div>
  <div class="glow"></div>
  <div class="frame"></div>
  <div class="stack">
    <img class="logo" src="data:image/png;base64,{logo}" alt="">
    <p class="headline">{HEADLINE}</p>
  </div>
  <div class="monster">{monster}</div>
</body></html>
"""


def main() -> int:
    if not CHROME.exists():
        sys.exit(f"Google Chrome not found at {CHROME}")

    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "og.html"
        page.write_text(build_html(), encoding="utf-8")

        OUT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                str(CHROME),
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--default-background-color=00000000",
                f"--window-size={SIZE[0]},{SIZE[1]}",
                # webfonts need a moment; Chrome paints too eagerly otherwise
                "--virtual-time-budget=4000",
                f"--screenshot={OUT}",
                page.as_uri(),
            ],
            check=True,
            capture_output=True,
        )

    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
