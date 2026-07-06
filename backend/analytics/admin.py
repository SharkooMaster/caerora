from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path

from .funnels import attribution_breakdown, funnel_summary, top_products
from .models import Event, InternalDevice


@admin.register(InternalDevice)
class InternalDeviceAdmin(admin.ModelAdmin):
    list_display = ("anonymous_id", "note", "created_at")
    search_fields = ("anonymous_id", "note")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "anonymous_id", "product", "value", "utm_source", "utm_campaign", "created_at")
    list_filter = ("event_type", "utm_source", "utm_campaign", "created_at")
    search_fields = ("anonymous_id", "session_id", "order_number", "utm_campaign")
    date_hierarchy = "created_at"
    readonly_fields = [f.name for f in Event._meta.fields]

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "dashboard/",
                self.admin_site.admin_view(self.dashboard_view),
                name="analytics_dashboard",
            ),
        ]
        return custom + urls

    def dashboard_view(self, request):
        try:
            days = int(request.GET.get("days", 30))
        except ValueError:
            days = 30
        summary = funnel_summary(days)
        context = {
            **self.admin_site.each_context(request),
            "title": "Marketing dashboard",
            "days": days,
            "kpis": summary["kpis"],
            "funnel": summary["funnel"],
            "attribution": attribution_breakdown(days),
            "top_products": top_products(days),
            "ranges": [7, 14, 30, 90],
        }
        return TemplateResponse(request, "admin/analytics/dashboard.html", context)
