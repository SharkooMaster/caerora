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
