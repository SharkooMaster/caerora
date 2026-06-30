from decimal import Decimal

from django.db import models

from core.models import TimeStampedModel


class ShippingZone(TimeStampedModel):
    """A group of countries sharing shipping rates and currency."""

    name = models.CharField(max_length=120, unique=True)
    # Comma-separated ISO-3166 alpha-2 codes, e.g. "DE,FR,NL". "*" matches any.
    countries = models.TextField(
        help_text="Comma-separated ISO country codes (e.g. DE,FR,NL). Use * for rest of world."
    )
    currency = models.CharField(max_length=3, default="eur")
    # VAT / sales tax applied to the subtotal for this zone, as a percentage.
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0"),
        help_text="Tax percentage applied to subtotal (e.g. 21.00 for 21% VAT).",
    )
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "name")

    def __str__(self):
        return self.name

    @property
    def country_list(self):
        return [c.strip().upper() for c in self.countries.split(",") if c.strip()]

    def matches(self, country_code):
        codes = self.country_list
        return "*" in codes or (country_code or "").upper() in codes

    @classmethod
    def for_country(cls, country_code):
        zones = cls.objects.filter(is_active=True).order_by("position")
        wildcard = None
        for zone in zones:
            codes = zone.country_list
            if (country_code or "").upper() in codes:
                return zone
            if "*" in codes:
                wildcard = wildcard or zone
        return wildcard


class ShippingRate(TimeStampedModel):
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name="rates")
    name = models.CharField(max_length=120, default="Standard")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # Orders at or above this subtotal ship free. Null = never free.
    free_over = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_estimate = models.CharField(max_length=120, blank=True, help_text="e.g. '2-4 business days'")
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "price")

    def __str__(self):
        return f"{self.zone.name} - {self.name}"

    def effective_price(self, subtotal: Decimal) -> Decimal:
        if self.free_over is not None and subtotal >= self.free_over:
            return Decimal("0.00")
        return self.price
