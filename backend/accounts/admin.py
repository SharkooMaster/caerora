from django.contrib import admin

from .models import ConsentRecord, NewsletterSubscriber


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "source", "created_at")
    list_filter = ("is_active", "source")
    search_fields = ("email",)


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ("kind", "email", "anonymous_id", "granted", "analytics", "marketing", "created_at")
    list_filter = ("kind", "granted", "analytics", "marketing")
    search_fields = ("email", "anonymous_id")
    readonly_fields = [f.name for f in ConsentRecord._meta.fields]
