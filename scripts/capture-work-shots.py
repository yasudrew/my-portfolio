#!/usr/bin/env python3
"""Capture first-view screenshots of the client work and write them to /public.

Usage:
    npm run shots                  # every entry that has no image yet
    npm run shots -- --all         # re-capture everything
    npm run shots -- alumnote      # just these slugs

Reads the sites from src/content/works.ts so the list never has to be kept in
two places: add an entry there and it is captured on the next run.

Requires Google Chrome and Pillow (`pip3 install Pillow`).

Some heroes cannot be captured this way. A first view driven by WebGL renders
as an empty frame under headless Chrome, and a blank image is worse than none —
so a capture that looks empty is rejected rather than saved, and that entry
keeps its typographic fallback card until a shot is supplied by hand.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageStat
except ImportError:
    sys.exit("Pillow is required: pip3 install Pillow")

ROOT = Path(__file__).resolve().parent.parent
WORKS_TS = ROOT / "src" / "content" / "works.ts"
OUT_DIR = ROOT / "public" / "works"

CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

VIEWPORT = (1440, 900)
# Generous: several of these sites hold their first view behind an intro.
TIME_BUDGET_MS = 20000
WEBP_QUALITY = 82
# Colour spread below this means the page never painted. Measured on the middle
# of the frame, since headers and footers render even when the hero does not.
MIN_CENTRE_SPREAD = 12.0

ENTRY = re.compile(
    r'slug:\s*"(?P<slug>[^"]+)"'
    r'[^}]*?'
    r'url:\s*"(?P<url>[^"]+)"',
    re.S,
)


def read_entries() -> list[tuple[str, str]]:
    """Pull (slug, url) out of the works module."""
    source = WORKS_TS.read_text(encoding="utf-8")
    entries = [(m["slug"], m["url"]) for m in ENTRY.finditer(source)]
    if not entries:
        sys.exit(
            f"No entries found in {WORKS_TS.relative_to(ROOT)} — "
            "the file's shape probably changed; update ENTRY in this script."
        )
    return entries


def capture(url: str, destination: Path) -> bool:
    """Screenshot `url` into `destination`. False if Chrome produced nothing."""
    subprocess.run(
        [
            str(CHROME),
            "--headless",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--window-size={VIEWPORT[0]},{VIEWPORT[1]}",
            f"--virtual-time-budget={TIME_BUDGET_MS}",
            f"--screenshot={destination}",
            url,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return destination.exists() and destination.stat().st_size > 0


def centre_spread(image: Image.Image) -> float:
    """Colour variation across the middle of the frame."""
    width, height = image.size
    box = (width // 8, height // 5, width - width // 8, height - height // 5)
    return sum(ImageStat.Stat(image.crop(box)).stddev) / 3


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("slugs", nargs="*", help="only these slugs")
    parser.add_argument("--all", action="store_true", help="re-capture existing")
    args = parser.parse_args()

    if not CHROME.exists():
        sys.exit(f"Google Chrome not found at {CHROME}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    entries = read_entries()

    if args.slugs:
        wanted = set(args.slugs)
        known = {slug for slug, _ in entries}
        unknown = wanted - known
        if unknown:
            sys.exit(f"Unknown slug(s): {', '.join(sorted(unknown))}")
        entries = [e for e in entries if e[0] in wanted]

    captured, skipped, rejected = 0, 0, []

    with tempfile.TemporaryDirectory() as tmp:
        for slug, url in entries:
            final = OUT_DIR / f"{slug}.webp"

            if final.exists() and not args.all and not args.slugs:
                print(f"skip    {slug:20} (already captured)")
                skipped += 1
                continue

            raw = Path(tmp) / f"{slug}.png"
            print(f"…       {slug:20} {url}")

            if not capture(url, raw):
                print(f"FAILED  {slug:20} Chrome produced no image")
                rejected.append(slug)
                continue

            image = Image.open(raw).convert("RGB")
            spread = centre_spread(image)

            if spread < MIN_CENTRE_SPREAD:
                print(
                    f"EMPTY   {slug:20} centre spread {spread:.1f} — "
                    "hero likely needs a real GPU; supply this one by hand"
                )
                rejected.append(slug)
                continue

            image.save(final, "WEBP", quality=WEBP_QUALITY, method=6)
            print(f"saved   {slug:20} {final.stat().st_size // 1024}KB")
            captured += 1

    print(
        f"\n{captured} captured, {skipped} skipped"
        + (f", {len(rejected)} need a manual shot: {', '.join(rejected)}" if rejected else "")
    )

    if rejected:
        print(
            f"\nDrop a 16:10 image at {OUT_DIR.relative_to(ROOT)}/<slug>.webp and add "
            "`shot` to that entry in src/content/works.ts."
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
