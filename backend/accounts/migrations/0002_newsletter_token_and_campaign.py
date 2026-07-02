import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def gen_tokens(apps, schema_editor):
    Subscriber = apps.get_model("accounts", "NewsletterSubscriber")
    for sub in Subscriber.objects.all().iterator():
        sub.unsubscribe_token = uuid.uuid4()
        sub.save(update_fields=["unsubscribe_token"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0001_initial"),
    ]

    operations = [
        # 1) Add as nullable/non-unique so existing rows are accepted.
        migrations.AddField(
            model_name="newslettersubscriber",
            name="unsubscribe_token",
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
        # 2) Backfill a distinct token for every existing subscriber.
        migrations.RunPython(gen_tokens, noop),
        # 3) Enforce uniqueness / non-null to match the model.
        migrations.AlterField(
            model_name="newslettersubscriber",
            name="unsubscribe_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.CreateModel(
            name="NewsletterCampaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(max_length=200)),
                ("preheader", models.CharField(blank=True, max_length=200)),
                ("body_html", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("sending", "Sending"), ("sent", "Sent"), ("failed", "Failed")], default="draft", max_length=10)),
                ("scheduled_at", models.DateTimeField(blank=True, null=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("recipients_count", models.PositiveIntegerField(default=0)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="newsletter_campaigns", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]
