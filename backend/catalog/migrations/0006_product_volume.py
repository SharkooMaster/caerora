from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0005_productvariant_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="volume",
            field=models.CharField(blank=True, max_length=60),
        ),
    ]
