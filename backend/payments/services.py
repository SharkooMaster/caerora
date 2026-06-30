import logging
from decimal import Decimal

import stripe
from django.conf import settings

logger = logging.getLogger(__name__)


def _configure():
    stripe.api_key = settings.STRIPE_SECRET_KEY


def to_minor_units(amount: Decimal) -> int:
    """Convert a decimal amount to the smallest currency unit (cents)."""
    return int((amount * 100).quantize(Decimal("1")))


def create_payment_intent_for_order(order) -> dict:
    """Create or update a Stripe PaymentIntent for an order.

    Returns a dict with client_secret + publishable_key. If Stripe is not
    configured (e.g. local demo without keys), returns an empty client_secret
    so the flow degrades gracefully.
    """
    if not settings.STRIPE_SECRET_KEY:
        return {"client_secret": "", "publishable_key": settings.STRIPE_PUBLISHABLE_KEY}

    _configure()
    amount = to_minor_units(order.total)

    metadata = {
        "order_number": order.number,
        "order_id": str(order.id),
        "anonymous_id": order.anonymous_id,
        "utm_source": order.utm_source,
        "utm_medium": order.utm_medium,
        "utm_campaign": order.utm_campaign,
    }

    try:
        if order.stripe_payment_intent_id:
            intent = stripe.PaymentIntent.modify(
                order.stripe_payment_intent_id,
                amount=amount,
                currency=order.currency,
                metadata=metadata,
            )
        else:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=order.currency,
                metadata=metadata,
                receipt_email=order.email,
                automatic_payment_methods={"enabled": True},
            )
            order.stripe_payment_intent_id = intent.id
            order.save(update_fields=["stripe_payment_intent_id", "updated_at"])
    except stripe.error.StripeError as exc:
        # Don't fail the whole checkout if Stripe is misconfigured/unavailable;
        # the order exists and payment can be retried.
        logger.error("Stripe PaymentIntent failed for %s: %s", order.number, exc)
        return {"client_secret": "", "publishable_key": settings.STRIPE_PUBLISHABLE_KEY}

    return {
        "client_secret": intent.client_secret,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
    }
