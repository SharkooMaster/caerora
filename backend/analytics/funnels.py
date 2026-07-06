from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDay, TruncHour
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


def session_funnel(days: int = 30):
    """Funnel counted in unique *sessions*, so each step answers "how many
    visitors got this far" instead of raw event volume."""
    since = timezone.now() - timedelta(days=days)
    qs = Event.objects.filter(created_at__gte=since).exclude(session_id="")

    def sessions_with(event_type):
        return qs.filter(event_type=event_type).values("session_id").distinct().count()

    total = qs.values("session_id").distinct().count()
    steps = [
        {"step": "Visited the site", "sessions": total},
        {"step": "Viewed a product", "sessions": sessions_with(EventType.VIEW_ITEM)},
        {"step": "Added to cart", "sessions": sessions_with(EventType.ADD_TO_CART)},
        {"step": "Went to checkout", "sessions": sessions_with(EventType.BEGIN_CHECKOUT)},
        {"step": "Purchased", "sessions": sessions_with(EventType.PURCHASE)},
    ]
    for i, s in enumerate(steps):
        s["rate_of_visits"] = _safe_rate(s["sessions"], total)
        s["rate_of_previous"] = _safe_rate(s["sessions"], steps[i - 1]["sessions"]) if i else 100.0
    return steps


def timeseries(days: int = 30):
    """Sessions / product views / checkouts / purchases per bucket. Hourly for
    short windows so today's ad traffic is visible, daily otherwise."""
    since = timezone.now() - timedelta(days=days)
    trunc = TruncHour if days <= 2 else TruncDay
    qs = Event.objects.filter(created_at__gte=since)

    rows = (
        qs.annotate(bucket=trunc("created_at"))
        .values("bucket", "event_type")
        .annotate(n=Count("id"), s=Count("session_id", distinct=True))
        .order_by("bucket")
    )
    buckets = {}
    for r in rows:
        b = buckets.setdefault(
            r["bucket"],
            {"page_views": 0, "sessions": 0, "product_views": 0, "add_to_cart": 0, "begin_checkout": 0, "purchases": 0},
        )
        et, n = r["event_type"], r["n"]
        if et == EventType.PAGE_VIEW:
            b["page_views"] += n
        elif et == EventType.VIEW_ITEM:
            b["product_views"] += n
        elif et == EventType.ADD_TO_CART:
            b["add_to_cart"] += n
        elif et == EventType.BEGIN_CHECKOUT:
            b["begin_checkout"] += n
        elif et == EventType.PURCHASE:
            b["purchases"] += n

    # Unique sessions per bucket (any event type).
    session_rows = (
        qs.exclude(session_id="")
        .annotate(bucket=trunc("created_at"))
        .values("bucket")
        .annotate(s=Count("session_id", distinct=True))
    )
    for r in session_rows:
        if r["bucket"] in buckets:
            buckets[r["bucket"]]["sessions"] = r["s"]

    return [
        {"t": b.isoformat(), **vals}
        for b, vals in sorted(buckets.items())
    ]


def top_pages(days: int = 30, limit: int = 10):
    """Most viewed paths plus how many arrived there first (entry pages)."""
    since = timezone.now() - timedelta(days=days)
    views = Event.objects.filter(created_at__gte=since, event_type=EventType.PAGE_VIEW)

    by_path = (
        views.exclude(path="")
        .values("path")
        .annotate(views=Count("id"), sessions=Count("session_id", distinct=True))
        .order_by("-views")[:limit]
    )

    # Entry page = the earliest page_view of each session.
    entries = {}
    first_views = (
        views.exclude(session_id="").exclude(path="")
        .order_by("session_id", "created_at")
        .values_list("session_id", "path")
    )
    seen = set()
    for sid, path in first_views:
        if sid in seen:
            continue
        seen.add(sid)
        entries[path] = entries.get(path, 0) + 1

    return [
        {
            "path": r["path"],
            "views": r["views"],
            "sessions": r["sessions"],
            "entries": entries.get(r["path"], 0),
        }
        for r in by_path
    ]


def browse_depth(days: int = 30):
    """How many distinct products each session viewed — did they keep browsing?"""
    since = timezone.now() - timedelta(days=days)
    qs = Event.objects.filter(created_at__gte=since).exclude(session_id="")

    total = qs.values("session_id").distinct().count()
    per_session = (
        qs.filter(event_type=EventType.VIEW_ITEM, product__isnull=False)
        .values("session_id")
        .annotate(n=Count("product", distinct=True))
    )
    dist = {"0": total, "1": 0, "2": 0, "3": 0, "4+": 0}
    for row in per_session:
        dist["0"] -= 1
        n = row["n"]
        key = "4+" if n >= 4 else str(min(n, 3))
        dist[key] += 1
    dist["0"] = max(dist["0"], 0)
    return [{"products_viewed": k, "sessions": v, "share": _safe_rate(v, total)} for k, v in dist.items()]


def recent_activity(limit: int = 60):
    """Latest events with timestamps for a live activity feed."""
    events = (
        Event.objects.select_related("product")
        .exclude(event_type=EventType.PRODUCT_DWELL)
        .order_by("-created_at")[:limit]
    )
    return [
        {
            "at": e.created_at.isoformat(),
            "type": e.event_type,
            "path": e.path,
            "product": e.product.name if e.product else None,
            "value": float(e.value) if e.value is not None else None,
            "source": e.utm_source,
            "session": (e.session_id or e.anonymous_id or "")[:8],
        }
        for e in events
    ]
