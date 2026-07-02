from django.db import models

from core.models import TimeStampedModel


class SiteContent(TimeStampedModel):
    """Editable, storefront-wide copy and imagery.

    A single row (pk=1) drives the homepage hero, promo bar, brand band and
    newsletter section. The storefront falls back to sensible built-in defaults
    for any field left blank, so an empty row never breaks the page.
    """

    # Announcement / promo bar
    promo_bar_text = models.CharField(max_length=200, blank=True)

    # Hero
    hero_eyebrow = models.CharField(max_length=80, blank=True)
    hero_title = models.CharField(max_length=120, blank=True)
    hero_title_accent = models.CharField(max_length=120, blank=True)
    hero_subtitle = models.TextField(blank=True)
    hero_cta_label = models.CharField(max_length=60, blank=True)
    hero_cta_href = models.CharField(max_length=200, blank=True)
    hero_image = models.ImageField(upload_to="site/", blank=True, null=True)

    # Cinematic brand band
    brand_band_title = models.CharField(max_length=160, blank=True)
    brand_band_body = models.TextField(blank=True)
    brand_band_image = models.ImageField(upload_to="site/", blank=True, null=True)

    # Newsletter band
    newsletter_title = models.CharField(max_length=160, blank=True)
    newsletter_body = models.TextField(blank=True)

    # Social sharing
    og_image = models.ImageField(upload_to="site/", blank=True, null=True)

    class Meta:
        verbose_name = "site content"
        verbose_name_plural = "site content"

    def __str__(self):
        return "Site content"

    def save(self, *args, **kwargs):
        # Enforce a single row.
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class GalleryImage(TimeStampedModel):
    """Images for the homepage "@caerora" social strip."""

    image = models.ImageField(upload_to="gallery/")
    alt_text = models.CharField(max_length=200, blank=True)
    link_url = models.CharField(max_length=300, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return self.alt_text or f"Gallery image {self.pk}"


class Testimonial(TimeStampedModel):
    """Curated marketing testimonials shown in the site design.

    Distinct from per-product reviews — these are hand-picked quotes we choose
    to feature (e.g. on the homepage).
    """

    author_name = models.CharField(max_length=120)
    handle = models.CharField(
        max_length=120, blank=True, help_text="e.g. @handle or a location/title."
    )
    quote = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5, help_text="1-5 stars.")
    photo = models.ImageField(upload_to="testimonials/", blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "-created_at")

    def __str__(self):
        return f"{self.author_name}: {self.quote[:40]}"
