#!/usr/bin/env python3
"""Caerora product sourcing screener.

Scrapes/loads dropshipping candidates and scores them against our winning-product
criteria, then emits an import-ready JSON for `manage.py import_products`.

Criteria (a candidate must pass ALL hard gates):
  - retail price $15-40
  - unit cost <= 35% of retail  (>= 65% gross margin)
  - rating >= 4.7
  - orders/reviews >= 500
  - est. weight <= 500 g
  - shipping <= 10-15 days to EU/US
  - supplier age >= 2 years (soft gate - warns if unknown)

Usage:
  # Screen candidates from a hand-collected/scraped JSON or CSV:
  python3 tools/source_products.py screen candidates.json -o sourced_products.json

  # Attempt a live AliExpress search (best effort - AliExpress aggressively
  # bot-blocks; falls back cleanly with an explanation):
  python3 tools/source_products.py search "ice roller face" "gua sha set"

Candidate input format (list of objects, unknown fields are kept):
  {
    "name": "Ice Roller for Face",
    "supplier_url": "https://www.aliexpress.com/item/...",
    "unit_cost_usd": 4.20,
    "retail_usd": 24.00,          # optional; auto-suggested if missing
    "rating": 4.8,
    "orders": 5200,
    "store_years": 4,             # optional
    "weight_g": 180,              # optional; estimated from keywords if missing
    "ship_days_max": 12,          # optional
    "category": "Tools",
    "why": "Depuffs skin in minutes; visible transformation."
  }
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

# Rough weight estimates (grams) by product-type keyword, used when the
# listing does not state a weight. Conservative on purpose.
WEIGHT_HINTS = [
    (r"ice roller", 200), (r"gua ?sha", 150), (r"jade roller", 180),
    (r"heatless curl", 120), (r"scalp massager", 120), (r"eyelash curler", 60),
    (r"mirror", 450), (r"steamer", 480), (r"silk pillowcase", 250),
    (r"brush set", 350), (r"claw clip", 150), (r"headband", 90),
    (r"blender|sponge", 40), (r"tweezer", 50), (r"roller", 200),
    (r"comb", 80), (r"hair towel", 220), (r"patches", 100),
]

HARD_GATES = {
    "retail_min": 15.0,
    "retail_max": 40.0,
    "max_cost_ratio": 0.35,
    "min_rating": 4.7,
    "min_orders": 500,
    "max_weight_g": 500,
    "max_ship_days": 15,
}


def estimate_weight(name: str) -> int:
    low = name.lower()
    for pattern, grams in WEIGHT_HINTS:
        if re.search(pattern, low):
            return grams
    return 300  # unknown: assume mid-weight


def suggest_retail(cost: float) -> float:
    """Price at ~72% margin, psychologically rounded, clamped to $15-40."""
    raw = cost / 0.28
    candidates = [15, 19, 22, 24, 26, 29, 32, 34, 38, 40]
    best = min(candidates, key=lambda c: abs(c - raw))
    return float(max(best, 15))


def screen_one(c: dict) -> dict:
    """Return the candidate annotated with score, verdict and reasons."""
    reasons: list[str] = []
    name = c.get("name", "?")
    cost = float(c.get("unit_cost_usd") or 0)
    retail = float(c.get("retail_usd") or 0) or suggest_retail(cost)
    rating = float(c.get("rating") or 0)
    orders = int(c.get("orders") or 0)
    weight = int(c.get("weight_g") or estimate_weight(name))
    ship = int(c.get("ship_days_max") or 15)
    years = c.get("store_years")

    g = HARD_GATES
    if not g["retail_min"] <= retail <= g["retail_max"]:
        reasons.append(f"retail ${retail:.0f} outside ${g['retail_min']:.0f}-{g['retail_max']:.0f}")
    ratio = cost / retail if retail else 1
    if ratio > g["max_cost_ratio"]:
        reasons.append(f"cost ratio {ratio:.0%} > {g['max_cost_ratio']:.0%} (margin too thin)")
    if rating < g["min_rating"]:
        reasons.append(f"rating {rating} < {g['min_rating']}")
    if orders < g["min_orders"]:
        reasons.append(f"orders {orders} < {g['min_orders']}")
    if weight > g["max_weight_g"]:
        reasons.append(f"est. weight {weight}g > {g['max_weight_g']}g")
    if ship > g["max_ship_days"]:
        reasons.append(f"shipping {ship}d > {g['max_ship_days']}d")

    warnings = []
    if years is None:
        warnings.append("store age unknown - verify 2+ years manually")
    elif float(years) < 2:
        reasons.append(f"store only {years}y old (< 2y)")
    if orders < 2000:
        warnings.append("orders < 2000 - acceptable but not ideal")

    margin = 1 - ratio
    # Soft score for ranking survivors: margin, social proof, rating headroom.
    score = round(margin * 50 + min(orders / 5000, 1) * 30 + (rating - 4.7) * 66, 1)

    return {
        **c,
        "retail_usd": retail,
        "weight_g": weight,
        "gross_margin": f"{margin:.0%}",
        "score": score,
        "passes": not reasons,
        "reject_reasons": reasons,
        "warnings": warnings,
    }


def cmd_screen(args: argparse.Namespace) -> None:
    path = Path(args.input)
    if path.suffix == ".csv":
        with path.open() as fh:
            candidates = list(csv.DictReader(fh))
    else:
        candidates = json.loads(path.read_text())

    results = [screen_one(c) for c in candidates]
    passed = sorted([r for r in results if r["passes"]], key=lambda r: -r["score"])
    failed = [r for r in results if not r["passes"]]

    print(f"Screened {len(results)} candidates: {len(passed)} passed, {len(failed)} rejected\n")
    for r in passed:
        print(f"  PASS  [{r['score']:>5}] {r['name']}  (cost ${float(r['unit_cost_usd']):.2f} -> retail ${r['retail_usd']:.2f}, {r['gross_margin']} margin)")
        for w in r["warnings"]:
            print(f"          ! {w}")
    for r in failed:
        print(f"  FAIL  {r['name']}: {'; '.join(r['reject_reasons'])}")

    out = Path(args.output)
    out.write_text(json.dumps(passed, indent=2))
    print(f"\nWrote {len(passed)} import-ready products to {out}")


def cmd_search(args: argparse.Namespace) -> None:
    """Best-effort live AliExpress search. AliExpress serves a JS-rendered,
    heavily bot-protected page, so this frequently gets blocked; when that
    happens, collect candidates manually (or with a real browser) and use
    the `screen` subcommand instead."""
    try:
        import requests
    except ImportError:
        sys.exit("pip install requests")

    found = []
    for term in args.terms:
        url = "https://www.aliexpress.com/w/wholesale-" + term.replace(" ", "-") + ".html"
        try:
            resp = requests.get(url, timeout=20, headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                "Accept-Language": "en-US,en;q=0.9",
            })
        except requests.RequestException as exc:
            print(f"  [{term}] request failed: {exc}")
            continue
        # The item data lives in window.runParams JSON when not bot-walled.
        match = re.search(r"window\.runParams\s*=\s*({.*?});", resp.text, re.DOTALL)
        if not match:
            print(f"  [{term}] blocked or JS-walled (HTTP {resp.status_code}) - use a browser + `screen` instead")
            continue
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            print(f"  [{term}] could not parse runParams")
            continue
        items = (data.get("mods") or {}).get("itemList", {}).get("content", [])
        for it in items:
            prices = it.get("prices") or {}
            sale = (prices.get("salePrice") or {}).get("minPrice")
            trade = (it.get("trade") or {}).get("realTradeCount")
            star = (it.get("evaluation") or {}).get("starRating")
            found.append({
                "name": it.get("title", {}).get("displayTitle", ""),
                "supplier_url": f"https://www.aliexpress.com/item/{it.get('productId')}.html",
                "unit_cost_usd": float(sale) if sale else None,
                "rating": float(star) if star else None,
                "orders": int(trade) if trade else 0,
                "search_term": term,
            })
        print(f"  [{term}] collected {len(items)} raw items")

    out = Path(args.output)
    out.write_text(json.dumps(found, indent=2))
    print(f"Wrote {len(found)} raw candidates to {out} - now run the `screen` subcommand on it")


IMG_RE = re.compile(r"https://ae0\d\.alicdn\.com/kf/[A-Za-z0-9]+/[^\"']+?\.(?:jpg|png|webp)")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"


def harvest_images(item_url: str, limit: int = 4) -> list[str]:
    """Pull the supplier's own gallery photos straight off an AliExpress item page."""
    import requests

    resp = requests.get(item_url, timeout=25, headers={"User-Agent": UA})
    resp.raise_for_status()
    seen, urls = set(), []
    for m in IMG_RE.finditer(resp.text):
        url = m.group(0)
        # Skip tiny UI sprites like .../208x824.png
        if re.search(r"/\d+x\d+\.(png|jpg|webp)$", url):
            continue
        key = url.split("/kf/")[1].split("/")[0]
        if key in seen:
            continue
        seen.add(key)
        urls.append(url)
        if len(urls) >= limit:
            break
    return urls


def cmd_images(args: argparse.Namespace) -> None:
    """Fill each product's `images` list with photos scraped from its supplier_url."""
    path = Path(args.input)
    items = json.loads(path.read_text())
    for item in items:
        url = item.get("supplier_url", "")
        if "/item/" not in url:
            print(f"  skip (no item URL): {item.get('name')}")
            continue
        try:
            imgs = harvest_images(url, args.limit)
        except Exception as exc:
            print(f"  FAIL {item.get('name')}: {exc}")
            continue
        item["images"] = imgs
        print(f"  {item.get('name')}: {len(imgs)} images")
    path.write_text(json.dumps(items, indent=2))
    print(f"Updated {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_screen = sub.add_parser("screen", help="Score candidates against the criteria table")
    p_screen.add_argument("input", help="candidates.json or .csv")
    p_screen.add_argument("-o", "--output", default="sourced_products.json")
    p_screen.set_defaults(func=cmd_screen)

    p_search = sub.add_parser("search", help="Best-effort live AliExpress search")
    p_search.add_argument("terms", nargs="+")
    p_search.add_argument("-o", "--output", default="raw_candidates.json")
    p_search.set_defaults(func=cmd_search)

    p_images = sub.add_parser("images", help="Harvest supplier gallery photos into the JSON")
    p_images.add_argument("input", help="sourced_products.json (updated in place)")
    p_images.add_argument("--limit", type=int, default=4, help="Max photos per product")
    p_images.set_defaults(func=cmd_images)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
