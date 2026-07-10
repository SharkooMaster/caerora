"""Replace the makeup-era homepage testimonials with clothing-brand quotes.

Old rows are deleted (they referenced mascara/lip products that no longer
exist); the new set stays fully editable in Studio → Testimonials.
"""

from django.db import migrations

TESTIMONIALS = [
    ("Jonas E.", "@jonas.e — Stockholm, Sweden",
     "The Dawn Hoodie is the heaviest, best-made hoodie I own. The gold star embroidery is subtle enough for every day, but people always end up asking about it.", 5),
    ("Amara O.", "@amara.walks — Rotterdam, Netherlands",
     "I love that every season follows the story. I started with The Calling crewneck and now I'm slowly collecting the whole narrative. The quality is honestly unmatched at this price.", 5),
    ("Levi B.", "@levib — Hamburg, Germany",
     "Wore the Cross Hoodie to youth group and three people asked where it was from. Quiet design, real weight, zero cheap print feeling — it's all embroidered.", 5),
    ("Naomi R.", "@naomi.reads — Copenhagen, Denmark",
     "The Empty Tomb tee is my favourite thing in my wardrobe. The fabric is thick but soft, and the woven label with the verse is such a beautiful detail.", 5),
    ("Samuel K.", "@samk_ — Vienna, Austria",
     "Ordered two sizes to compare and the return was completely painless. Kept the M — true to size, boxy in the right way. Will be back for the next season.", 4),
    ("Elin M.", "@elin.m — Oslo, Norway",
     "Gave the Shepherd crewneck to my dad for his baptism anniversary. He hasn't taken it off since. Faith-led clothing that actually looks and feels premium.", 5),
]


def seed(apps, schema_editor):
    Testimonial = apps.get_model("content", "Testimonial")
    Testimonial.objects.all().delete()
    for pos, (name, handle, quote, rating) in enumerate(TESTIMONIALS):
        Testimonial.objects.create(
            author_name=name, handle=handle, quote=quote,
            rating=rating, position=pos, is_active=True,
        )


def unseed(apps, schema_editor):
    Testimonial = apps.get_model("content", "Testimonial")
    Testimonial.objects.filter(
        author_name__in=[t[0] for t in TESTIMONIALS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_sitecontent_story_fields"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
