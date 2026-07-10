import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0008_product_benefits'),
    ]

    operations = [
        migrations.CreateModel(
            name='Season',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('number', models.PositiveIntegerField(help_text='Position in the story (1-13). Shown as a roman numeral.', unique=True)),
                ('name', models.CharField(max_length=120, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=140, unique=True)),
                ('subtitle', models.CharField(blank=True, max_length=120)),
                ('act', models.CharField(blank=True, max_length=120)),
                ('description', models.TextField(blank=True)),
                ('scripture_ref', models.CharField(blank=True, max_length=80)),
                ('scripture_text', models.TextField(blank=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='seasons/')),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ('number',),
            },
        ),
        migrations.AddField(
            model_name='product',
            name='season',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='catalog.season'),
        ),
    ]
