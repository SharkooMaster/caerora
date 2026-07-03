#!/usr/bin/env python3
"""Download og:image product photos from retailer pages into sourcing/images/makeup/."""
import re
import sys
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

PAGES = {
    "nyx-fat-oil-lip-drip": [
        "https://lyko.com/en/nyx-professional-makeup/nyx-fat-oil-lip-drip-04-that-s-chic",
        "https://lyko.com/sv/nyx-professional-makeup/nyx-professional-makeup-fat-oil-lip-drip-09-chilli-48-ml",
    ],
    "nyx-butter-gloss": [
        "https://lyko.com/sv/nyx-professional-makeup/nyx-butter-glosstiramisu",
        "https://www.apohem.se/smink/lappar/lappglans/nyx-professional-makeup-butter-lip-gloss-7-tiramisu-8-ml",
    ],
    "elf-glow-reviver-lip-oil": [
        "https://lyko.com/sv/elf/e.l.f-glow-reviver-lip-oil-jam-session-76ml",
        "https://lyko.com/sv/elf/e.l.f-glow-reviver-lip-oil-glimmer-super-neutral-76ml",
    ],
    "elf-halo-glow-liquid-filter": [
        "https://lyko.com/sv/elf/e.l.f.-halo-glow-liquid-filter-4-medium",
        "https://lyko.com/sv/elf/e.l.f-halo-glow-liquid-filter-0-fair-315ml",
    ],
    "elf-power-grip-primer": [
        "https://lyko.com/sv/elf/e.l.f.-power-grip-primer-24ml",
    ],
    "elf-halo-glow-blush-wand": [
        "https://lyko.com/sv/elf/e.l.f-halo-glow-blush-beauty-wand-pink-me-up-10ml",
        "https://lyko.com/sv/elf/e.l.f-halo-glow-blush-beauty-wand-candlelit-10ml",
    ],
    "maybelline-eraser-concealer": [
        "https://www.aposmart.se/product/maybelline-instant-anti-age-eraser-concealer-neutralizer",
        "https://www.apotekpriser.se/produkt/k7Bxrx/Maybelline-Instant-Anti-Age-Eraser-Concealer-Fair",
    ],
    "essence-lash-princess": [
        "https://www.apohem.se/smink/ogonmakeup/mascara/essence-lash-princess-false-lash-effect-mascara-12-ml",
        "https://lyko.com/sv/essence/essence-lash-princess-false-lash-effect-mascara-waterproof",
    ],
    "maybelline-sky-high": [
        "https://lyko.com/sv/maybelline-new-york/maybelline-lash-sensational-sky-high-black-",
        "https://www.kicks.se/maybelline-lash-sensational-sky-high-mascara-black",
    ],
    "nyx-epic-ink-liner": [
        "https://lyko.com/sv/nyx-professional-makeup/nyx-epic-ink-lnrshade-01",
        "https://www.apohem.se/smink/ogonmakeup/eyeliner-kajal/nyx-professional-makeup-epic-ink-liner-1-black-1-ml",
    ],
}

OG_RE = re.compile(r'<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"', re.I)
OG_RE2 = re.compile(r'<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"', re.I)

out_dir = Path(__file__).parent / "images" / "makeup"
out_dir.mkdir(parents=True, exist_ok=True)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "sv,en"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


ok, fail = 0, 0
for key, urls in PAGES.items():
    for i, page in enumerate(urls):
        dest = out_dir / f"{key}-{i}.jpg"
        if dest.exists():
            print(f"skip {dest.name}")
            ok += 1
            continue
        try:
            html = fetch(page).decode("utf-8", "ignore")
            m = OG_RE.search(html) or OG_RE2.search(html)
            if not m:
                print(f"FAIL no og:image: {page}", file=sys.stderr)
                fail += 1
                continue
            img_url = m.group(1).replace("&amp;", "&")
            data = fetch(img_url)
            if len(data) < 5000:
                print(f"FAIL tiny image ({len(data)}b): {img_url}", file=sys.stderr)
                fail += 1
                continue
            dest.write_bytes(data)
            print(f"ok   {dest.name}  ({len(data)//1024} KB)  <- {img_url[:90]}")
            ok += 1
        except Exception as exc:
            print(f"FAIL {page}: {exc}", file=sys.stderr)
            fail += 1

print(f"\n{ok} ok, {fail} failed")
