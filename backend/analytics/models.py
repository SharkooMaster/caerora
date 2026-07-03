from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class EventType(models.TextChoices):
    PAGE_VIEW = "page_view", "Page view"
    VIEW_ITEM_LIST = "view_item_list", "View product list"
    SELECT_ITEM = "select_item", "Click product (CTR)"
    VIEW_ITEM = "view_item", "View product"
    PRODUCT_DWELL = "product_dwell", "Product time-on-page"
    ADD_TO_CART = "add_to_cart", "Add to cart"
    BEGIN_CHECKOUT = "begin_checkout", "Begin checkout"
    ADD_SHIPPING_INFO = "add_shipping_info", "Add shipping info"
    ADD_PAYMENT_INFO = "add_payment_info", "Add payment info"
    PURCHASE = "purchase", "Purchase"
    NEWSLETTER_SIGNUP = "newsletter_signup", "Newsletter signup"
    SEARCH = "search", "Site search"


class Event(TimeStampedModel):
    event_type = models.CharField(max_length=32, choices=EventType.choices, db_index=True)
    anonymous_id = models.CharField(max_length=64, db_index=True, blank=True)
    session_id = models.CharField(max_length=64, db_index=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )

    path = models.CharField(max_length=500, blank=True)
    referrer = models.CharField(max_length=500, blank=True)

    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )

    # Monetary value (for add_to_cart / purchase) and time-on-product.
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, blank=True)
    dwell_ms = models.PositiveIntegerField(null=True, blank=True)

    # Attribution
    utm_source = models.CharField(max_length=120, blank=True, db_index=True)
    utm_medium = models.CharField(max_length=120, blank=True)
    utm_campaign = models.CharField(max_length=160, blank=True, db_index=True)
    utm_term = models.CharField(max_length=160, blank=True)
    utm_content = models.CharField(max_length=160, blank=True)

    order_number = models.CharField(max_length=20, blank=True, db_index=True)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["utm_source", "utm_campaign"]),
        ]

    def __str__(self):
        return f"{self.event_type} @ {self.created_at:%Y-%m-%d %H:%M}"
