from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    source = models.CharField(max_length=120, blank=True, help_text="Where the signup happened.")

    def __str__(self):
        return self.email


class ConsentRecord(TimeStampedModel):
    """GDPR audit trail for cookie + marketing consent decisions."""

    class Kind(models.TextChoices):
        COOKIE = "cookie", "Cookie consent"
        MARKETING = "marketing", "Marketing consent"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="consents"
    )
    email = models.EmailField(blank=True)
    anonymous_id = models.CharField(max_length=64, blank=True, db_index=True)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    # For cookie consent: which categories were accepted.
    analytics = models.BooleanField(default=False)
    marketing = models.BooleanField(default=False)
    necessary = models.BooleanField(default=True)
    granted = models.BooleanField(default=False)
    policy_version = models.CharField(max_length=20, default="1.0")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=400, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.kind} consent ({self.anonymous_id or self.email})"
