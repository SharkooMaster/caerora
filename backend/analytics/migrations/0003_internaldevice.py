from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0002_alter_event_event_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='InternalDevice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('anonymous_id', models.CharField(max_length=64, unique=True)),
                ('note', models.CharField(blank=True, max_length=200)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
