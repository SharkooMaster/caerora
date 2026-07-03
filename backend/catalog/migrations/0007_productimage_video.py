from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0006_product_volume"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.ImageField(blank=True, upload_to="products/"),
        ),
        migrations.AddField(
            model_name="productimage",
            name="video",
            field=models.FileField(blank=True, upload_to="products/videos/"),
        ),
    ]
