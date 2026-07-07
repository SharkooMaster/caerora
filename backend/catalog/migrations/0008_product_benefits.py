from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0007_productimage_video'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='benefits',
            field=models.TextField(blank=True),
        ),
    ]
