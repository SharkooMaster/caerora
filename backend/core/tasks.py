from celery import shared_task
from django.conf import settings

from .pushover import notify


@shared_task
def push_new_order(order_id):
    from orders.models import Order

    order = Order.objects.filter(id=order_id).prefetch_related("items").first()
    if not order:
        return
    items = ", ".join(f"{i.quantity}x {i.product_name}" for i in order.items.all()) or "no items"
    notify(
        title=f"New order {order.number}",
        message=(
            f"{order.currency.upper()} {order.total:.2f} from {order.full_name} "
            f"({order.email}, {order.country})\n{items}"
        ),
        priority=1,
        url=f"{settings.SITE_URL.rstrip('/')}/studio/orders/{order.number}",
        url_title="Open in Studio",
    )


@shared_task
def push_new_account(user_id):
    from django.contrib.auth import get_user_model

    user = get_user_model().objects.filter(id=user_id).first()
    if not user:
        return
    name = (user.get_full_name() or "").strip()
    notify(
        title="New account created",
        message=f"{name + ' - ' if name else ''}{user.email or user.username}",
    )
