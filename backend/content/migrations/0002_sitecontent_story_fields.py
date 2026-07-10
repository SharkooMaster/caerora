from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitecontent',
            name='story_eyebrow',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='sitecontent',
            name='story_title',
            field=models.CharField(blank=True, max_length=160),
        ),
        migrations.AddField(
            model_name='sitecontent',
            name='story_body',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='sitecontent',
            name='brand_band_eyebrow',
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
