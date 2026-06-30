import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from analytics.tracking import record_purchase
from emails.tasks import send_order_confirmation_email
from orders.models import Order
from orders.services import mark_order_paid


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        if secret:
            event = stripe.Webhook.construct_event(payload, sig_header, secret)
        else:
            # No secret configured (local dev) - parse without verification.
            import json
            event = json.loads(payload.decode("utf-8"))
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "payment_intent.succeeded":
        _handle_payment_succeeded(obj)
    elif event_type == "payment_intent.payment_failed":
        _handle_payment_failed(obj)

    return HttpResponse(status=200)


def _handle_payment_succeeded(intent):
    order = _find_order(intent)
    if not order:
        return
    already_paid = order.is_paid
    mark_order_paid(order, payment_intent_id=intent.get("id", ""))
    if not already_paid:
        send_order_confirmation_email.delay(order.id)
        # Server-side conversion event for GA4 + Meta CAPI (more reliable than client).
        record_purchase(order)


def _handle_payment_failed(intent):
    order = _find_order(intent)
    if order and not order.is_paid:
        order.payment_status = Order.PaymentStatus.FAILED
        order.save(update_fields=["payment_status", "updated_at"])


def _find_order(intent):
    pi_id = intent.get("id", "")
    order = Order.objects.filter(stripe_payment_intent_id=pi_id).first()
    if order:
        return order
    number = (intent.get("metadata") or {}).get("order_number")
    if number:
        return Order.objects.filter(number=number).first()
    return None


@api_view(["GET"])
@permission_classes([AllowAny])
def stripe_config(request):
    return Response({"publishable_key": settings.STRIPE_PUBLISHABLE_KEY})
