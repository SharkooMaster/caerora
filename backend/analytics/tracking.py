"""Server-side conversion tracking: write a purchase Event and forward to
GA4 Measurement Protocol + Meta Conversions API for reliable attribution."""
import logging
import time

import requests
from django.conf import settings

from .models import Event, EventType

logger = logging.getLogger(__name__)


def record_purchase(order):
    """Called from the Stripe webhook once an order is paid."""
    _log_purchase_event(order)
    _send_ga4_purchase(order)
    _send_meta_purchase(order)


def _log_purchase_event(order):
    try:
        Event.objects.create(
            event_type=EventType.PURCHASE,
            anonymous_id=order.anonymous_id,
            value=order.total,
            currency=order.currency,
            utm_source=order.utm_source,
            utm_medium=order.utm_medium,
            utm_campaign=order.utm_campaign,
            order_number=order.number,
            meta={"items": order.items.count()},
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to record purchase event for %s", order.number)


def _send_ga4_purchase(order):
    if not (settings.GA4_API_SECRET and settings.GA4_MEASUREMENT_ID and order.anonymous_id):
        return
    url = (
        "https://www.google-analytics.com/mp/collect"
        f"?measurement_id={settings.GA4_MEASUREMENT_ID}&api_secret={settings.GA4_API_SECRET}"
    )
    payload = {
        "client_id": order.anonymous_id,
        "events": [{
            "name": "purchase",
            "params": {
                "transaction_id": order.number,
                "value": float(order.total),
                "currency": order.currency.upper(),
                "shipping": float(order.shipping_total),
                "tax": float(order.tax_total),
                "items": [
                    {
                        "item_name": i.product_name,
                        "item_variant": i.variant_name,
                        "price": float(i.unit_price),
                        "quantity": i.quantity,
                    }
                    for i in order.items.all()
                ],
            },
        }],
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except requests.RequestException:
        logger.warning("GA4 purchase event failed for %s", order.number)


def _send_meta_purchase(order):
    if not (settings.META_CAPI_ACCESS_TOKEN and settings.META_CAPI_PIXEL_ID):
        return
    url = f"https://graph.facebook.com/v19.0/{settings.META_CAPI_PIXEL_ID}/events"
    payload = {
        "data": [{
            "event_name": "Purchase",
            "event_time": int(time.time()),
            "event_id": order.number,
            "action_source": "website",
            "user_data": {"em": [_hash_email(order.email)]},
            "custom_data": {
                "currency": order.currency.upper(),
                "value": float(order.total),
            },
        }],
        "access_token": settings.META_CAPI_ACCESS_TOKEN,
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except requests.RequestException:
        logger.warning("Meta CAPI purchase event failed for %s", order.number)


def _hash_email(email: str) -> str:
    import hashlib

    return hashlib.sha256(email.strip().lower().encode()).hexdigest()
