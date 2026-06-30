from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "author_name", "rating", "status", "is_verified_purchase", "created_at")
    list_filter = ("status", "rating", "is_verified_purchase")
    search_fields = ("author_name", "author_email", "title", "body", "product__name")
    list_editable = ("status",)
    actions = ("approve_reviews", "reject_reviews")

    @admin.action(description="Approve selected reviews")
    def approve_reviews(self, request, queryset):
        queryset.update(status=Review.Status.APPROVED)

    @admin.action(description="Reject selected reviews")
    def reject_reviews(self, request, queryset):
        queryset.update(status=Review.Status.REJECTED)
