from celery import shared_task
from django.conf import settings

from . import templates
from .service import send_email


@shared_task
def send_order_confirmation_email(order_id):
    from orders.models import Order

    order = Order.objects.filter(id=order_id).prefetch_related("items").first()
    if not order:
        return
    send_email(
        to=order.email,
        subject=f"Your Caerora order {order.number}",
        html=templates.order_confirmation_html(order),
    )
    # Notify the shop's order inbox too.
    if settings.ADMIN_NOTIFICATION_EMAIL:
        send_email(
            to=settings.ADMIN_NOTIFICATION_EMAIL,
            subject=f"New order {order.number} - {order.currency.upper()} {order.total:.2f}",
            html=templates.admin_new_order_html(order),
        )


@shared_task
def send_order_shipped_email(order_id):
    from orders.models import Order

    order = Order.objects.filter(id=order_id).prefetch_related("items").first()
    if not order:
        return
    send_email(
        to=order.email,
        subject=f"Your Caerora order {order.number} has shipped",
        html=templates.order_shipped_html(order),
    )


@shared_task
def send_newsletter_campaign(campaign_id):
    """Send a newsletter broadcast to all active subscribers via Resend.

    Idempotent-ish: only sends when the campaign is in a sendable state and
    records progress on the campaign row.
    """
    from django.utils import timezone

    from accounts.models import NewsletterCampaign, NewsletterSubscriber

    campaign = NewsletterCampaign.objects.filter(id=campaign_id).first()
    if not campaign or campaign.status == NewsletterCampaign.Status.SENT:
        return

    site_url = getattr(settings, "SITE_URL", "").rstrip("/")
    subscribers = NewsletterSubscriber.objects.filter(is_active=True)

    sent = 0
    for sub in subscribers.iterator():
        unsubscribe_url = f"{site_url}/api/newsletter/unsubscribe/{sub.unsubscribe_token}/"
        html = templates.newsletter_html(campaign.body_html, unsubscribe_url)
        result = send_email(to=sub.email, subject=campaign.subject, html=html)
        # Even when Resend is unconfigured (result None) we count the intent so
        # local/dev runs complete; real failures are logged in the service.
        sent += 1

    campaign.recipients_count = sent
    campaign.status = NewsletterCampaign.Status.SENT
    campaign.sent_at = timezone.now()
    campaign.save(update_fields=["recipients_count", "status", "sent_at", "updated_at"])


@shared_task
def send_newsletter_test(campaign_id, email):
    from accounts.models import NewsletterCampaign

    campaign = NewsletterCampaign.objects.filter(id=campaign_id).first()
    if not campaign:
        return
    html = templates.newsletter_html(campaign.body_html, "")
    send_email(to=email, subject=f"[TEST] {campaign.subject}", html=html)
