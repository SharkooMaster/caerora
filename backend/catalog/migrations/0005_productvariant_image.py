import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_product_brand"),
    ]

    operations = [
        migrations.AddField(
            model_name="productvariant",
            name="image",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="variants",
                to="catalog.productimage",
            ),
        ),
    ]
