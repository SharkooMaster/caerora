from django.db import migrations


def seed_summer26(apps, schema_editor):
    DiscountCode = apps.get_model("orders", "DiscountCode")
    DiscountCode.objects.get_or_create(
        code="SUMMER26",
        defaults={"percent_off": 10, "is_active": True},
    )


def unseed_summer26(apps, schema_editor):
    DiscountCode = apps.get_model("orders", "DiscountCode")
    DiscountCode.objects.filter(code="SUMMER26", used_count=0).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0002_discountcode_order_discount_code"),
    ]

    operations = [
        migrations.RunPython(seed_summer26, unseed_summer26),
    ]
