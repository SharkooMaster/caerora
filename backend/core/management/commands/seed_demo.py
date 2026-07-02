import io
import random
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from catalog.models import Category, Product, ProductImage, ProductVariant
from reviews.models import Review
from shipping.models import ShippingRate, ShippingZone

BRAND_BG = [
    (250, 247, 244),  # ivory
    (216, 195, 165),  # champagne
    (184, 143, 147),  # rose
    (141, 116, 112),  # taupe
]
ACCENT = (91, 59, 74)  # plum


def make_image(label: str, sub: str, bg) -> bytes:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (900, 1100), bg)
    draw = ImageDraw.Draw(img)

    def font(size):
        try:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", size)
        except Exception:
            return ImageFont.load_default()

    # Soft inner panel
    draw.rectangle([90, 120, 810, 980], outline=(255, 255, 255), width=3)
    wm = font(72)
    draw.text((450, 470), label, font=wm, fill=ACCENT, anchor="mm")
    sm = font(30)
    draw.text((450, 560), sub, font=sm, fill=(70, 60, 60), anchor="mm")
    brand = font(26)
    draw.text((450, 1030), "CAERORA", font=brand, fill=ACCENT, anchor="mm")

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


REVIEW_SNIPPETS = [
    ("Absolutely obsessed", "The color payoff is incredible and it lasts all day. Worth every cent."),
    ("My new everyday", "Lightweight, blends like a dream, and the packaging feels so luxe."),
    ("Better than luxury brands", "Comparable to products twice the price. Caerora has my full trust now."),
    ("Stunning finish", "Natural, glowy, and not cakey at all. I get compliments constantly."),
    ("Repurchasing for sure", "Fast shipping, beautiful product. Exactly as described."),
    ("Gentle and effective", "No irritation on my sensitive skin and the results speak for themselves."),
]

PRODUCTS = [
    ("Lips", "Velvet Matte Lipstick", "Weightless, full-pigment matte color",
     [("Rose Nude", "#B88F93"), ("Dusty Plum", "#5B3B4A"), ("Terracotta", "#B9745A"), ("Espresso", "#2B2424")],
     Decimal("24.00")),
    ("Lips", "Glass Lip Oil", "High-shine, nourishing tinted oil",
     [("Clear", "#FAF7F4"), ("Petal", "#B88F93"), ("Berry", "#5B3B4A")],
     Decimal("19.00")),
    ("Face", "Luminous Silk Foundation", "Skin-like medium coverage that lasts",
     [("Porcelain", "#F0E0D5"), ("Sand", "#D8C3A5"), ("Honey", "#B9745A"), ("Walnut", "#8D5A44")],
     Decimal("38.00")),
    ("Face", "Soft Focus Blush", "Buildable, breathable cheek color",
     [("Rosewood", "#B88F93"), ("Warm Peach", "#B9745A"), ("Mauve", "#8D7470")],
     Decimal("26.00")),
    ("Eyes", "Defining Mascara", "Volume and length, smudge-proof",
     [("Black", "#2B2424"), ("Brown", "#5b3b2a")],
     Decimal("22.00")),
    ("Eyes", "Nude Edit Palette", "Nine everyday neutral shades",
     [("The Nude Edit", "#D8C3A5")],
     Decimal("42.00")),
    ("Skin", "Hydrating Primer Serum", "Glass-skin glow base",
     [("30ml", "#FAF7F4"), ("50ml", "#D8C3A5")],
     Decimal("34.00")),
    ("Skin", "Overnight Renewal Cream", "Restorative moisture barrier",
     [("50ml", "#B88F93")],
     Decimal("46.00")),
]


class Command(BaseCommand):
    help = "Seed demo categories, products, variants, reviews and shipping zones."

    def handle(self, *args, **options):
        if Product.objects.exists():
            self.stdout.write("Products already exist; skipping product seed.")
        else:
            self._seed_catalog()
        self._seed_shipping()
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def _seed_catalog(self):
        categories = {}
        for i, name in enumerate(["Lips", "Face", "Eyes", "Skin"]):
            categories[name], _ = Category.objects.get_or_create(
                name=name, defaults={"position": i}
            )

        sku_n = 1000
        for cat_name, name, tagline, shades, price in PRODUCTS:
            product = Product.objects.create(
                category=categories[cat_name],
                name=name,
                tagline=tagline,
                description=(
                    f"{name}. {tagline}. A Caerora essential, formulated with clean, "
                    "cruelty-free ingredients for beautiful, long-wearing results."
                ),
                brand_copy=(
                    "Clean, high-performance beauty from Caerora \u2014 designed to feel like you "
                    "and made to last. Shop with confidence: fast tracked delivery and 30-day returns."
                ),
                ingredients="Clean, cruelty-free and vegan. Full ingredient list is shown on the product packaging.",
                how_to_use="Apply to clean skin and build to your desired intensity.",
                is_featured=random.random() < 0.5,
                is_active=True,
            )
            bg = random.choice(BRAND_BG)
            for pos, (shade_name, hexv) in enumerate(shades):
                ProductVariant.objects.create(
                    product=product,
                    name=shade_name,
                    sku=f"CA-{sku_n}",
                    swatch_hex=hexv,
                    price=price,
                    compare_at_price=price + Decimal("6.00") if random.random() < 0.3 else None,
                    stock=random.randint(15, 80),
                    position=pos,
                )
                sku_n += 1

            for pos in range(2):
                data = make_image(name.split()[0], shades[0][0] if pos == 0 else "Caerora", bg)
                pi = ProductImage(product=product, alt_text=name, position=pos)
                pi.image.save(f"{product.slug}-{pos}.jpg", ContentFile(data), save=True)

            n_reviews = random.randint(3, 6)
            for _ in range(n_reviews):
                title, body = random.choice(REVIEW_SNIPPETS)
                Review.objects.create(
                    product=product,
                    author_name=random.choice(
                        ["Sophie", "Mia", "Lena", "Aria", "Nora", "Chloe", "Emma", "Isla"]
                    ),
                    rating=random.choice([4, 5, 5, 5]),
                    title=title,
                    body=body,
                    is_verified_purchase=True,
                    status=Review.Status.APPROVED,
                )
            self.stdout.write(f"  + {name} ({len(shades)} variants)")

    def _seed_shipping(self):
        zones = [
            ("European Union", "DE,FR,NL,BE,IT,ES,PT,AT,IE,FI,SE,DK,PL,LU", "eur", Decimal("21.00"),
             [("Standard", Decimal("4.95"), Decimal("45.00"), "2-4 business days"),
              ("Express", Decimal("9.95"), None, "1-2 business days")]),
            ("United Kingdom", "GB", "gbp", Decimal("20.00"),
             [("Standard", Decimal("4.50"), Decimal("40.00"), "2-4 business days")]),
            ("United States", "US", "usd", Decimal("0.00"),
             [("Standard", Decimal("6.00"), Decimal("50.00"), "3-6 business days"),
              ("Express", Decimal("14.00"), None, "1-3 business days")]),
            ("Rest of World", "*", "eur", Decimal("0.00"),
             [("International", Decimal("14.95"), Decimal("90.00"), "5-12 business days")]),
        ]
        for pos, (name, countries, currency, tax, rates) in enumerate(zones):
            zone, created = ShippingZone.objects.get_or_create(
                name=name,
                defaults={"countries": countries, "currency": currency, "tax_rate": tax, "position": pos},
            )
            if created:
                for rpos, (rname, price, free_over, eta) in enumerate(rates):
                    ShippingRate.objects.create(
                        zone=zone, name=rname, price=price, free_over=free_over,
                        delivery_estimate=eta, position=rpos,
                    )
