"""Seed the thirteen Caerora seasons — one narrative, from the first light
to the eternal day. Names, copy and imagery stay editable in the Studio."""

from django.db import migrations
from django.utils.text import slugify

SEASONS = [
    {
        "number": 1,
        "name": "The Dawn",
        "subtitle": "The Birth",
        "act": "Act I — The Coming",
        "scripture_ref": "Luke 2:11",
        "scripture_text": "Today in the town of David a Savior has been born to you; he is Christ the Lord.",
        "description": "Where the story begins. Midnight navy and gold — a star over Bethlehem, light breaking into the dark. Every dawn declares His mercy.",
    },
    {
        "number": 2,
        "name": "The Wilderness",
        "subtitle": "The Temptation",
        "act": "Act I — The Coming",
        "scripture_ref": "Matthew 4:1",
        "scripture_text": "Jesus was led by the Spirit into the wilderness to be tempted by the devil.",
        "description": "Forty days of sand, stone and resolve. Earth tones and quiet strength — stand firm in the faith. It is written.",
    },
    {
        "number": 3,
        "name": "The Calling",
        "subtitle": "The Disciples",
        "act": "Act I — The Coming",
        "scripture_ref": "Matthew 4:19",
        "scripture_text": "Come, follow me, and I will send you out to fish for people.",
        "description": "Boats left on the shore, nets left behind. Navy, ocean blue and ivory — for everyone who dropped everything and followed Him.",
    },
    {
        "number": 4,
        "name": "The Kingdom",
        "subtitle": "The Sermon",
        "act": "Act II — The Ministry",
        "scripture_ref": "Matthew 5:3",
        "scripture_text": "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
        "description": "The Sermon on the Mount in sage, olive and soft light. Blessed are the humble — seek first the kingdom of God.",
    },
    {
        "number": 5,
        "name": "Signs & Wonders",
        "subtitle": "The Miracles",
        "act": "Act II — The Ministry",
        "scripture_ref": "Matthew 16:16",
        "scripture_text": "You are the Christ, the Son of the living God.",
        "description": "Storms stilled, water into wine, bread for thousands. Deep sea and midnight tones for the One the wind and waves obey.",
    },
    {
        "number": 6,
        "name": "The Shepherd",
        "subtitle": "The Parables",
        "act": "Act II — The Ministry",
        "scripture_ref": "John 10:11",
        "scripture_text": "I am the good shepherd. The good shepherd lays down his life for the sheep.",
        "description": "Clay, wheat and olive — golden-hour fields and the ninety-nine. He knows His sheep, and His sheep know Him.",
    },
    {
        "number": 7,
        "name": "Jerusalem",
        "subtitle": "The Entry",
        "act": "Act III — The Passion",
        "scripture_ref": "Matthew 21:9",
        "scripture_text": "Hosanna! Blessed is he who comes in the name of the Lord!",
        "description": "Palm branches on ancient stone. Olive, dust and gold — the King rode toward the cross, not on a warhorse but a colt.",
    },
    {
        "number": 8,
        "name": "The Cross",
        "subtitle": "Golgotha",
        "act": "Act III — The Passion",
        "scripture_ref": "John 19:30",
        "scripture_text": "It is finished.",
        "description": "Obsidian, charcoal and a single line of crimson. The debt was paid in full — the heaviest day, worn in the darkest palette.",
    },
    {
        "number": 9,
        "name": "The Empty Tomb",
        "subtitle": "The Resurrection",
        "act": "Act III — The Passion",
        "scripture_ref": "Matthew 28:6",
        "scripture_text": "He is not here; he has risen, just as he said.",
        "description": "White, gold and first light. The stone rolled away — not to let Him out, but to let us in. The story had only begun.",
    },
    {
        "number": 10,
        "name": "The Spirit",
        "subtitle": "Pentecost",
        "act": "Act IV — The Church",
        "scripture_ref": "Acts 2:4",
        "scripture_text": "All of them were filled with the Holy Spirit.",
        "description": "Ivory and flame — tongues of fire, wind in the upper room. The same Spirit who raised Christ now lives in you.",
    },
    {
        "number": 11,
        "name": "The Way",
        "subtitle": "The Early Church",
        "act": "Act IV — The Church",
        "scripture_ref": "Acts 4:32",
        "scripture_text": "All the believers were one in heart and mind.",
        "description": "Forest green, cream and bark — the breaking of bread, the open door. Before they were called Christians, they were called The Way.",
    },
    {
        "number": 12,
        "name": "The Mission",
        "subtitle": "Paul's Journeys",
        "act": "Act IV — The Church",
        "scripture_ref": "Matthew 28:19",
        "scripture_text": "Go and make disciples of all nations.",
        "description": "Navy, bronze and parchment — maps, compasses and open water. The message was never meant to stay still. Sent. So are you.",
    },
    {
        "number": 13,
        "name": "The New Creation",
        "subtitle": "The New Earth",
        "act": "Act IV — The Church",
        "scripture_ref": "Revelation 21:5",
        "scripture_text": "Behold, I am making all things new.",
        "description": "Royal blue, white and gold — the city, the river, the tree of life. The first light becomes the eternal day. All things new.",
    },
]


def seed(apps, schema_editor):
    Season = apps.get_model("catalog", "Season")
    for s in SEASONS:
        Season.objects.update_or_create(
            number=s["number"],
            defaults={**s, "slug": slugify(s["name"]), "is_active": True},
        )


def unseed(apps, schema_editor):
    Season = apps.get_model("catalog", "Season")
    Season.objects.filter(number__in=[s["number"] for s in SEASONS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0009_season_product_season"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
