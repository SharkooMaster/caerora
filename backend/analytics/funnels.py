from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.utils import timezone

from .models import Event, EventType


def _safe_rate(numerator, denominator):
    if not denominator:
        return 0.0
    return round(100.0 * numerator / denominator, 2)


def funnel_summary(days: int = 30):
    """Compute the core marketing funnel + KPIs over a rolling window."""
    since = timezone.now() - timedelta(days=days)
    qs = Event.objects.filter(created_at__gte=since)

    counts = {row["event_type"]: row["n"] for row in qs.values("event_type").annotate(n=Count("id"))}

    page_views = counts.get(EventType.PAGE_VIEW, 0)
    list_views = counts.get(EventType.VIEW_ITEM_LIST, 0)
    selects = counts.get(EventType.SELECT_ITEM, 0)
    item_views = counts.get(EventType.VIEW_ITEM, 0)
    add_to_cart = counts.get(EventType.ADD_TO_CART, 0)
    begin_checkout = counts.get(EventType.BEGIN_CHECKOUT, 0)
    purchases = counts.get(EventType.PURCHASE, 0)

    # Unique sessions for a session-based conversion rate.
    sessions = qs.exclude(session_id="").values("session_id").distinct().count()

    revenue = qs.filter(event_type=EventType.PURCHASE).aggregate(total=Sum("value"))["total"] or 0
    avg_order_value = round(float(revenue) / purchases, 2) if purchases else 0.0

    # Average time-on-product from dwell events (ms -> seconds).
    avg_dwell_ms = qs.filter(event_type=EventType.PRODUCT_DWELL).aggregate(a=Avg("dwell_ms"))["a"] or 0
    avg_dwell_seconds = round(avg_dwell_ms / 1000.0, 1)

    funnel = [
        {"step": "Product list views", "count": list_views},
        {"step": "Product clicks (CTR)", "count": selects},
        {"step": "Product views", "count": item_views},
        {"step": "Add to cart", "count": add_to_cart},
        {"step": "Begin checkout", "count": begin_checkout},
        {"step": "Purchase", "count": purchases},
    ]

    kpis = {
        "page_views": page_views,
        "sessions": sessions,
        "revenue": round(float(revenue), 2),
        "purchases": purchases,
        "avg_order_value": avg_order_value,
        "avg_time_on_product_seconds": avg_dwell_seconds,
        # CTR = product clicks / product list impressions
        "ctr": _safe_rate(selects, list_views),
        "view_to_cart_rate": _safe_rate(add_to_cart, item_views),
        "cart_to_checkout_rate": _safe_rate(begin_checkout, add_to_cart),
        "checkout_to_purchase_rate": _safe_rate(purchases, begin_checkout),
        # Overall conversion = purchases / sessions
        "conversion_rate": _safe_rate(purchases, sessions),
    }

    return {"days": days, "funnel": funnel, "kpis": kpis}


def attribution_breakdown(days: int = 30, limit: int = 12):
    """Per-campaign performance: sessions, purchases, revenue, conversion."""
    since = timezone.now() - timedelta(days=days)
    qs = Event.objects.filter(created_at__gte=since)

    rows = []
    sources = (
        qs.values("utm_source", "utm_campaign")
        .annotate(events=Count("id"))
        .order_by("-events")[:limit]
    )
    for s in sources:
        seg = qs.filter(utm_source=s["utm_source"], utm_campaign=s["utm_campaign"])
        sessions = seg.exclude(session_id="").values("session_id").distinct().count()
        purchases = seg.filter(event_type=EventType.PURCHASE).count()
        revenue = seg.filter(event_type=EventType.PURCHASE).aggregate(t=Sum("value"))["t"] or 0
        rows.append({
            "source": s["utm_source"] or "(direct)",
            "campaign": s["utm_campaign"] or "(none)",
            "sessions": sessions,
            "purchases": purchases,
            "revenue": round(float(revenue), 2),
            "conversion_rate": _safe_rate(purchases, sessions),
        })
    return rows


def top_products(days: int = 30, limit: int = 8):
    since = timezone.now() - timedelta(days=days)
    qs = Event.objects.filter(created_at__gte=since, event_type=EventType.VIEW_ITEM, product__isnull=False)
    rows = (
        qs.values("product__name", "product__slug")
        .annotate(views=Count("id"))
        .order_by("-views")[:limit]
    )
    return [{"name": r["product__name"], "slug": r["product__slug"], "views": r["views"]} for r in rows]
