import json
from decimal import Decimal
from pathlib import Path

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from catalog.models import Category, Product, ProductImage, ProductVariant

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"


class Command(BaseCommand):
    """Import sourced products from a JSON file produced by tools/source_products.py.

    Expected item shape (extra keys ignored):
      {
        "name": "...", "category": "Tools", "tagline": "...",
        "description": "...", "how_to_use": "...",
        "retail_usd": 24.0, "compare_at_usd": 32.0,        # optional compare-at
        "unit_cost_usd": 4.2, "supplier_url": "https://...",
        "supplier_notes": "...",
        "variants": [{"name": "Standard", "stock": 60}],    # optional; default single variant
        "images": ["https://..."],                          # optional remote photos
        "sku_prefix": "CT"                                  # optional
      }
    """

    help = "Import sourced products (with supplier links) from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument("json_path", help="Path to sourced products JSON")
        parser.add_argument(
            "--deactivate-others",
            action="store_true",
            help="Deactivate every product NOT in this import (retires seeded demo items).",
        )
        parser.add_argument("--currency-rate", type=float, default=0.92,
                            help="USD->EUR conversion for retail prices (default 0.92)")

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options["json_path"])
        if not path.exists():
            raise CommandError(f"{path} does not exist")
        self.base_dir = path.parent
        items = json.loads(path.read_text())
        rate = Decimal(str(options["currency_rate"]))

        imported_ids = []
        next_sku = self._next_sku_number()

        for item in items:
            name = item["name"].strip()
            category, _ = Category.objects.get_or_create(
                name=item.get("category", "Beauty Tools").strip(),
                defaults={"is_active": True},
            )
            retail = (Decimal(str(item["retail_usd"])) * rate).quantize(Decimal("1")) - Decimal("0.05")
            compare = None
            if item.get("compare_at_usd"):
                compare = (Decimal(str(item["compare_at_usd"])) * rate).quantize(Decimal("1")) - Decimal("0.05")

            slug = slugify(name)[:200]
            product, created = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "category": category,
                    "name": name,
                    "brand": item.get("brand", ""),
                    "tagline": item.get("tagline", ""),
                    "description": item.get("description", ""),
                    "brand_copy": item.get(
                        "brand_copy",
                        "A Caerora ritual essential — chosen for visible results, tested for quality, "
                        "and backed by tracked delivery and 30-day returns.",
                    ),
                    "how_to_use": item.get("how_to_use", ""),
                    "is_active": True,
                    "is_featured": bool(item.get("featured")),
                    "supplier_url": item.get("supplier_url", ""),
                    "supplier_notes": item.get("supplier_notes", item.get("why", "")),
                    "supplier_cost": Decimal(str(item["unit_cost_usd"])) if item.get("unit_cost_usd") else None,
                },
            )
            imported_ids.append(product.id)

            variants = item.get("variants") or [{"name": "Standard", "stock": 50}]
            prefix = item.get("sku_prefix", "CT")
            for pos, v in enumerate(variants):
                sku = v.get("sku") or f"CA-{prefix}{next_sku}"
                next_sku += 1
                ProductVariant.objects.update_or_create(
                    product=product,
                    name=v["name"],
                    defaults={
                        "sku": sku,
                        "swatch_hex": v.get("swatch_hex", ""),
                        "price": Decimal(str(v.get("price_usd"))) * rate if v.get("price_usd") else retail,
                        "compare_at_price": compare,
                        "stock": int(v.get("stock", 50)),
                        "position": pos,
                        "is_active": True,
                    },
                )

            for pos, url in enumerate(item.get("images", [])):
                if product.images.filter(position=pos).exists():
                    continue
                data = self._download(url)
                if data:
                    pi = ProductImage(product=product, alt_text=name, position=pos)
                    pi.image.save(f"{slug}-{pos}.jpg", ContentFile(data), save=True)

            self.stdout.write(f"  {'+' if created else '~'} {name} ({len(variants)} variants)")

        if options["deactivate_others"]:
            retired = Product.objects.exclude(id__in=imported_ids).update(is_active=False)
            self.stdout.write(f"  retired {retired} old products")

        self.stdout.write(self.style.SUCCESS(f"Imported {len(items)} products."))

    def _next_sku_number(self) -> int:
        return 5000 + ProductVariant.objects.count()

    def _download(self, url: str) -> bytes | None:
        # Local file path (relative to the JSON file) or remote URL.
        if not url.startswith("http"):
            local = self.base_dir / url
            if local.exists():
                return local.read_bytes()
            self.stderr.write(f"    image file not found: {local}")
            return None
        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": USER_AGENT})
            resp.raise_for_status()
            return resp.content
        except requests.RequestException as exc:
            self.stderr.write(f"    image failed {url}: {exc}")
            return None
