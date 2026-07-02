import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models

from catalog.models import ProductVariant
from core.models import TimeStampedModel


def generate_order_number():
    return "CA-" + uuid.uuid4().hex[:10].upper()


class DiscountCode(TimeStampedModel):
    """Percentage promo code redeemable at checkout (e.g. SUMMER26)."""

    code = models.CharField(max_length=40, unique=True)
    percent_off = models.PositiveSmallIntegerField()  # 1..100
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True)  # None = unlimited
    used_count = models.PositiveIntegerField(default=0)
    min_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))

    class Meta:
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} (-{self.percent_off}%)"

    def check_usable(self, subtotal: Decimal | None = None) -> tuple[bool, str]:
        from django.utils import timezone

        now = timezone.now()
        if not self.is_active:
            return False, "This code is no longer active."
        if self.starts_at and now < self.starts_at:
            return False, "This code is not active yet."
        if self.ends_at and now > self.ends_at:
            return False, "This code has expired."
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False, "This code has been fully redeemed."
        if subtotal is not None and subtotal < self.min_subtotal:
            return False, f"This code requires a minimum order of {self.min_subtotal:.2f}."
        return True, ""


class Order(TimeStampedModel):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class FulfillmentStatus(models.TextChoices):
        UNFULFILLED = "unfulfilled", "New"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    number = models.CharField(max_length=20, unique=True, default=generate_order_number, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)

    # Shipping address
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    postal_code = models.CharField(max_length=40)
    region = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=2)  # ISO alpha-2

    # Money
    currency = models.CharField(max_length=3, default="eur")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    shipping_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))

    shipping_method = models.CharField(max_length=120, blank=True)

    # Status
    payment_status = models.CharField(
        max_length=12, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    fulfillment_status = models.CharField(
        max_length=12, choices=FulfillmentStatus.choices, default=FulfillmentStatus.UNFULFILLED
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    tracking_number = models.CharField(max_length=120, blank=True)
    admin_notes = models.TextField(blank=True)

    # Payments
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, db_index=True)

    # Consent / marketing
    marketing_opt_in = models.BooleanField(default=False)

    # Promo code snapshot (code text kept even if the DiscountCode is deleted)
    discount_code = models.CharField(max_length=40, blank=True)

    # Attribution (filled from the client tracker)
    anonymous_id = models.CharField(max_length=64, blank=True, db_index=True)
    utm_source = models.CharField(max_length=120, blank=True)
    utm_medium = models.CharField(max_length=120, blank=True)
    utm_campaign = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.number

    @property
    def is_paid(self):
        return self.payment_status == self.PaymentStatus.PAID

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def recalculate(self):
        self.subtotal = sum((i.line_total for i in self.items.all()), Decimal("0"))
        self.total = self.subtotal + self.shipping_total + self.tax_total - self.discount_total
        return self.total


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, related_name="order_items")
    # Snapshot fields so order history is stable even if the product changes.
    product_name = models.CharField(max_length=200)
    variant_name = models.CharField(max_length=160)
    sku = models.CharField(max_length=64)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product_name} - {self.variant_name} x{self.quantity}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
