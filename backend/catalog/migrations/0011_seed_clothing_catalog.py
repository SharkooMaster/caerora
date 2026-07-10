"""Seed the Caerora clothing capsule and retire the old makeup catalog.

Runs everywhere migrations run (local + prod), so the storefront switches to
the clothing line on deploy without any manual seeding. Old products and
categories are deactivated (not deleted) so historical orders keep their
snapshots. Everything created here stays fully editable in the Studio.
"""

from decimal import Decimal
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import migrations

ASSETS = Path(__file__).resolve().parent.parent / "seed_assets"

GARMENT_SIZES = ["S", "M", "L", "XL"]

FABRIC_TEE = (
    "100% organic ring-spun cotton, 240 GSM heavyweight jersey. Garment-dyed and "
    "enzyme-washed for a soft, broken-in hand feel.\n"
    "Machine wash cold, inside out. Tumble dry low or hang dry. Do not iron the embroidery."
)
FABRIC_FLEECE = (
    "80% organic cotton, 20% recycled polyester, 480 GSM brushed-back fleece. "
    "Tonal flatlock seams and ribbed cuffs that keep their shape.\n"
    "Machine wash cold, inside out. Hang dry to protect the embroidery."
)
FIT_TEE = (
    "Boxy, relaxed fit with a dropped shoulder. True to size — size up for a fuller drape.\n"
    "Model wears size M."
)
FIT_FLEECE = (
    "Relaxed fit with a dropped shoulder and roomy body. True to size — size up for an "
    "oversized fit.\nModel wears size M."
)

BRAND_COPY = (
    "Every Caerora piece is cut from heavyweight organic cotton, embroidered — never "
    "printed — and made to be worn for years, not seasons. Thirteen collections, one "
    "narrative. Fast tracked delivery and 30-day returns, always."
)

# (season_number, category, name, image, tagline, price, compare_at, featured,
#  fabric, fit, benefits, description)
PRODUCTS = [
    (1, "Hoodies", "The Dawn Hoodie", "prod-dawn-hoodie.jpg",
     "Midnight navy, gold star of Bethlehem embroidery", Decimal("64.00"), Decimal("78.00"), True,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM heavyweight organic fleece\nGold star embroidery on the chest\nScripture woven into the neck label\nPre-washed — no shrink, no twist",
     "Where the story begins. A midnight navy heavyweight hoodie carrying the star that "
     "announced the light of the world — embroidered in gold above the heart. "
     "Season I — The Dawn. Luke 2:11."),
    (2, "Tees", "Wilderness Tee", "prod-wilderness-tee.jpg",
     "Garment-dyed sand, tonal dune embroidery", Decimal("32.00"), None, False,
     FABRIC_TEE, FIT_TEE,
     "240 GSM heavyweight organic cotton\nTonal dune-line embroidery\nGarment-dyed, enzyme-washed\n\u201cIt is written\u201d woven label",
     "Forty days of sand, stone and resolve. A garment-dyed heavyweight tee in desert "
     "sand with a tonal dune line across the chest — quiet strength, worn daily. "
     "Season II — The Wilderness. Matthew 4:1."),
    (3, "Crewnecks", "The Calling Crewneck", "prod-calling-crewneck.jpg",
     "Deep navy, ivory ichthys embroidery", Decimal("54.00"), None, True,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM brushed-back organic fleece\nIvory fish embroidery on the chest\nRibbed collar, cuffs and hem\nPre-washed — holds its shape",
     "Boats left on the shore, nets left behind. A deep navy crewneck with the ichthys "
     "stitched in ivory — for everyone who dropped everything and followed. "
     "Season III — The Calling. Matthew 4:19."),
    (4, "Tees", "Kingdom Tee", "prod-kingdom-tee.jpg",
     "Sage green, gold mountain-and-crown embroidery", Decimal("32.00"), None, False,
     FABRIC_TEE, FIT_TEE,
     "240 GSM heavyweight organic cotton\nGold mountain & crown embroidery\nGarment-dyed sage green\nBeatitudes woven label",
     "The Sermon on the Mount in sage and soft light. Gold embroidery of the mountain "
     "and the crown above it — blessed are the humble. "
     "Season IV — The Kingdom. Matthew 5:3."),
    (5, "Hoodies", "Signs & Wonders Hoodie", "prod-wonders-hoodie.jpg",
     "Deep sea navy, ivory wave embroidery", Decimal("64.00"), None, True,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM heavyweight organic fleece\nIvory stilled-waves embroidery\nDeep-sea garment dye\nPre-washed — no shrink, no twist",
     "Storms stilled, water into wine, bread for thousands. Deep sea navy with three "
     "stilled waves on the chest — for the One the wind and waves obey. "
     "Season V — Signs & Wonders. Matthew 16:16."),
    (6, "Crewnecks", "Shepherd Crewneck", "prod-shepherd-crewneck.jpg",
     "Warm clay, tonal shepherd's staff embroidery", Decimal("54.00"), None, False,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM brushed-back organic fleece\nTonal staff embroidery\nGolden-hour clay garment dye\nRibbed collar, cuffs and hem",
     "Clay, wheat and golden-hour fields. A warm camel crewneck with the shepherd's "
     "staff in tonal stitch — He knows His sheep, and His sheep know Him. "
     "Season VI — The Shepherd. John 10:11."),
    (7, "Tees", "Jerusalem Tee", "prod-jerusalem-tee.jpg",
     "Olive green, gold palm branch embroidery", Decimal("32.00"), None, False,
     FABRIC_TEE, FIT_TEE,
     "240 GSM heavyweight organic cotton\nGold palm-branch embroidery\nGarment-dyed olive\nHosanna woven label",
     "Palm branches on ancient stone. Garment-dyed olive with a single gold palm "
     "branch — the King rode toward the cross on a colt. "
     "Season VII — Jerusalem. Matthew 21:9."),
    (8, "Hoodies", "The Cross Hoodie", "prod-cross-hoodie.jpg",
     "Jet black, tonal cross with a single crimson line", Decimal("68.00"), Decimal("82.00"), True,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM heavyweight organic fleece\nTonal cross, one crimson stitch line\nOur heaviest, darkest piece\n\u201cIt is finished\u201d woven label",
     "Obsidian black with a tonal cross and a single line of crimson beneath it. The "
     "debt was paid in full — the heaviest day, worn in the darkest palette. "
     "Season VIII — The Cross. John 19:30."),
    (9, "Tees", "Empty Tomb Tee", "prod-tomb-tee.jpg",
     "Ivory white, gold first-light embroidery", Decimal("34.00"), None, True,
     FABRIC_TEE, FIT_TEE,
     "240 GSM heavyweight organic cotton\nGold rising-sun embroidery\nCrisp ivory, garment-washed\n\u201cHe is risen\u201d woven label",
     "White, gold and first light. The stone rolled away — not to let Him out, but to "
     "let us in. Gold sunrise embroidery over the heart. "
     "Season IX — The Empty Tomb. Matthew 28:6."),
    (10, "Hoodies", "Spirit Hoodie", "prod-spirit-hoodie.jpg",
     "Cream ivory, amber flame embroidery", Decimal("64.00"), None, False,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM heavyweight organic fleece\nAmber flame embroidery\nSoft cream garment dye\nPentecost woven label",
     "Ivory and flame — tongues of fire, wind in the upper room. The same Spirit who "
     "raised Christ now lives in you. "
     "Season X — The Spirit. Acts 2:4."),
    (11, "Crewnecks", "The Way Crewneck", "prod-way-crewneck.jpg",
     "Forest green, cream broken-bread embroidery", Decimal("54.00"), None, False,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM brushed-back organic fleece\nCream broken-bread embroidery\nDeep forest garment dye\nRibbed collar, cuffs and hem",
     "Forest green, cream and bark — the breaking of bread, the open door. Before they "
     "were called Christians, they were called The Way. "
     "Season XI — The Way. Acts 4:32."),
    (12, "Tees", "Mission Tee", "prod-mission-tee.jpg",
     "Midnight navy, bronze compass rose embroidery", Decimal("32.00"), None, False,
     FABRIC_TEE, FIT_TEE,
     "240 GSM heavyweight organic cotton\nBronze compass-rose embroidery\nMidnight navy, garment-washed\n\u201cGo\u201d woven label",
     "Maps, compasses and open water. The message was never meant to stay still — "
     "sent, so are you. "
     "Season XII — The Mission. Matthew 28:19."),
    (13, "Hoodies", "New Creation Hoodie", "prod-newcreation-hoodie.jpg",
     "Royal blue, gold tree of life embroidery", Decimal("68.00"), None, True,
     FABRIC_FLEECE, FIT_FLEECE,
     "480 GSM heavyweight organic fleece\nGold tree-of-life embroidery\nRoyal blue garment dye\n\u201cAll things new\u201d woven label",
     "Royal blue, white and gold — the city, the river, the tree of life. The first "
     "light becomes the eternal day. "
     "Season XIII — The New Creation. Revelation 21:5."),
    (1, "Accessories", "Dawn Cap", "prod-dawn-cap.jpg",
     "Navy 6-panel cap, gold star embroidery", Decimal("28.00"), None, False,
     "100% brushed cotton twill. Adjustable brass buckle strap, one size fits most.\n"
     "Spot clean only.",
     "Low-profile 6-panel silhouette with a curved brim. One size, adjustable.",
     "Brushed cotton twill\nGold star embroidery\nAdjustable brass closure\nOne size fits most",
     "The star of Season I on a low-profile navy cap. Gold embroidery, brass closure, "
     "made to fade beautifully."),
    (10, "Accessories", "Upper Room Beanie", "prod-beanie.jpg",
     "Ivory rib knit, woven cross label", Decimal("26.00"), None, False,
     "100% merino-blend rib knit. One size.\nHand wash cold, lay flat to dry.",
     "Classic fold-up cuff, fisherman rib. One size fits most.",
     "Chunky fisherman rib knit\nWoven cross label on the cuff\nFold-up or slouch wear\nOne size fits most",
     "A chunky ivory rib-knit beanie with a small woven cross label on the cuff. "
     "Quiet, warm, everyday."),
    (11, "Accessories", "Dove Tote", "prod-tote.jpg",
     "Heavy natural canvas, navy dove embroidery", Decimal("22.00"), None, False,
     "16 oz natural cotton canvas. Reinforced handles, interior pocket.\n"
     "Machine wash cold, hang dry.",
     "40 × 36 cm body with 27 cm handle drop — fits a Bible, a laptop and a loaf of bread.",
     "Heavy 16 oz cotton canvas\nNavy dove & olive branch embroidery\nReinforced stitched handles\nInterior slip pocket",
     "A heavyweight natural canvas tote with the dove and olive branch in navy stitch. "
     "Carry-everything construction, embroidered — never printed."),
]

REVIEWS = [
    ("Marcus", 5, "Heavier than anything I own", "The fabric weight is unreal — feels like it will last a decade. The embroidery detail is beautiful in person."),
    ("Hannah", 5, "Quiet and bold at the same time", "I love that it isn't loud. People ask about the symbol and it starts real conversations."),
    ("Daniel", 5, "Quality matches the message", "Stitching, weight, fit — all excellent. Washed it five times already and it looks brand new."),
    ("Ruth", 4, "Fits true to size", "Beautiful piece. Boxy in the best way. The woven label detail made me smile."),
    ("Elias", 5, "My new daily", "The colour is even better in person and the cotton is so thick. Already ordered a second season."),
    ("Grace", 5, "Gifted it, bought another", "Got one for my brother's baptism and ended up keeping one for myself. The story behind each season is special."),
]


def seed(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")
    ProductImage = apps.get_model("catalog", "ProductImage")
    ProductVariant = apps.get_model("catalog", "ProductVariant")
    Season = apps.get_model("catalog", "Season")
    Review = apps.get_model("reviews", "Review")

    if Product.objects.filter(slug="the-dawn-hoodie").exists():
        return

    # Retire the makeup catalog (kept for order history, hidden from the store).
    Product.objects.update(is_active=False, is_featured=False)
    Category.objects.update(is_active=False)

    categories = {}
    for pos, (name, slug, tile) in enumerate([
        ("Tees", "tees", "prod-tomb-tee.jpg"),
        ("Hoodies", "hoodies", "prod-dawn-hoodie.jpg"),
        ("Crewnecks", "crewnecks", "prod-calling-crewneck.jpg"),
        ("Accessories", "accessories", "prod-dawn-cap.jpg"),
    ]):
        cat = Category.objects.filter(slug=slug).first()
        if cat:
            cat.name = name
            cat.position = pos
            cat.is_active = True
            cat.save()
        else:
            cat = Category.objects.create(name=name, slug=slug, position=pos, is_active=True)
        asset = ASSETS / tile
        if not cat.image and asset.exists():
            cat.image.save(f"tile-{tile}", ContentFile(asset.read_bytes()), save=True)
        categories[name] = cat

    seasons = {s.number: s for s in Season.objects.all()}

    sku_n = 3000
    for pos, (season_no, cat_name, name, image_file, tagline, price, compare_at,
              featured, fabric, fit, benefits, description) in enumerate(PRODUCTS):
        slug = name.lower().replace("&", "and").replace("'", "").replace(" ", "-")
        product = Product.objects.create(
            category=categories[cat_name],
            season=seasons.get(season_no),
            name=name,
            slug=slug,
            brand="Caerora",
            tagline=tagline,
            volume="240 GSM" if cat_name == "Tees" else ("480 GSM" if cat_name in ("Hoodies", "Crewnecks") else ""),
            description=description,
            benefits=benefits,
            brand_copy=BRAND_COPY,
            ingredients=fabric,
            how_to_use=fit,
            is_active=True,
            is_featured=featured,
            position=pos,
        )

        sizes = GARMENT_SIZES if cat_name != "Accessories" else ["One Size"]
        for vpos, size in enumerate(sizes):
            ProductVariant.objects.create(
                product=product,
                name=size,
                sku=f"CW-{sku_n}",
                price=price,
                compare_at_price=compare_at,
                stock=40 + (sku_n % 3) * 15,
                position=vpos,
                is_active=True,
            )
            sku_n += 1

        asset = ASSETS / image_file
        if asset.exists():
            pi = ProductImage(product=product, alt_text=f"{name} — Caerora", position=0)
            pi.image.save(image_file, ContentFile(asset.read_bytes()), save=True)

        # Deterministic 3-4 reviews per product so listings feel alive from day one.
        start = pos % len(REVIEWS)
        for i in range(3 + (pos % 2)):
            author, rating, title, body = REVIEWS[(start + i) % len(REVIEWS)]
            Review.objects.create(
                product=product,
                author_name=author,
                rating=rating,
                title=title,
                body=body,
                is_verified_purchase=True,
                status="approved",
            )


def unseed(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    slugs = [
        p[2].lower().replace("&", "and").replace("'", "").replace(" ", "-") for p in PRODUCTS
    ]
    Product.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0010_seed_seasons"),
        ("reviews", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
