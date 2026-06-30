from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from catalog.models import ProductVariant
from shipping.models import ShippingRate, ShippingZone

from .models import Order, OrderItem


class CheckoutError(Exception):
    pass


def _money(value) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@transaction.atomic
def create_order_from_payload(data: dict) -> Order:
    """Validate an incoming checkout payload and create a pending Order.

    Prices, shipping and tax are computed server-side; the client total is never trusted.
    """
    items_in = data.get("items") or []
    if not items_in:
        raise CheckoutError("Your cart is empty.")

    country = (data.get("country") or "").upper()
    zone = ShippingZone.for_country(country)
    if not zone:
        raise CheckoutError("We do not currently ship to your country.")

    # Resolve variants and validate stock.
    resolved = []
    subtotal = Decimal("0")
    for line in items_in:
        try:
            variant = ProductVariant.objects.select_related("product").get(
                pk=line["variant_id"], is_active=True
            )
        except (ProductVariant.DoesNotExist, KeyError):
            raise CheckoutError("One of the items is no longer available.")
        qty = int(line.get("quantity", 1))
        if qty < 1:
            raise CheckoutError("Invalid quantity.")
        if variant.stock < qty:
            raise CheckoutError(f"Not enough stock for {variant.product.name} - {variant.name}.")
        line_total = variant.price * qty
        subtotal += line_total
        resolved.append((variant, qty))

    subtotal = _money(subtotal)

    # Shipping
    shipping_rate = None
    rate_id = data.get("shipping_rate_id")
    if rate_id:
        shipping_rate = ShippingRate.objects.filter(pk=rate_id, zone=zone, is_active=True).first()
    if not shipping_rate:
        shipping_rate = zone.rates.filter(is_active=True).first()
    if not shipping_rate:
        raise CheckoutError("No shipping method available for your country.")

    shipping_total = _money(shipping_rate.effective_price(subtotal))

    # Tax (per-zone VAT on subtotal)
    tax_total = _money(subtotal * (zone.tax_rate / Decimal("100")))

    total = _money(subtotal + shipping_total + tax_total)

    order = Order.objects.create(
        user=data.get("user"),
        email=data["email"],
        phone=data.get("phone", ""),
        first_name=data["first_name"],
        last_name=data["last_name"],
        address_line1=data["address_line1"],
        address_line2=data.get("address_line2", ""),
        city=data["city"],
        postal_code=data["postal_code"],
        region=data.get("region", ""),
        country=country,
        currency=zone.currency,
        subtotal=subtotal,
        shipping_total=shipping_total,
        tax_total=tax_total,
        total=total,
        shipping_method=shipping_rate.name,
        marketing_opt_in=bool(data.get("marketing_opt_in")),
        anonymous_id=data.get("anonymous_id", ""),
        utm_source=data.get("utm_source", ""),
        utm_medium=data.get("utm_medium", ""),
        utm_campaign=data.get("utm_campaign", ""),
    )

    for variant, qty in resolved:
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=variant.product.name,
            variant_name=variant.name,
            sku=variant.sku,
            unit_price=variant.price,
            quantity=qty,
        )

    return order


@transaction.atomic
def mark_order_paid(order: Order, payment_intent_id: str = ""):
    """Idempotently mark an order paid and decrement stock once."""
    if order.payment_status == Order.PaymentStatus.PAID:
        return order

    from django.utils import timezone

    order.payment_status = Order.PaymentStatus.PAID
    order.paid_at = timezone.now()
    if payment_intent_id:
        order.stripe_payment_intent_id = payment_intent_id
    order.save(update_fields=["payment_status", "paid_at", "stripe_payment_intent_id", "updated_at"])

    # Decrement stock now that payment is confirmed.
    for item in order.items.select_related("variant"):
        if item.variant:
            ProductVariant.objects.filter(pk=item.variant_id).update(
                stock=max(0, item.variant.stock - item.quantity)
            )

    return order
