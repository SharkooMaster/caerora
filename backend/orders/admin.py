from django.contrib import admin
from django.utils import timezone

from emails.tasks import send_order_shipped_email

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name", "variant_name", "sku", "unit_price", "quantity", "line_total")
    can_delete = False

    def line_total(self, obj):
        return obj.line_total


class PaidOrderFilter(admin.SimpleListFilter):
    """Quick toggle for the fulfillment inbox (paid orders awaiting action)."""

    title = "fulfillment inbox"
    parameter_name = "inbox"

    def lookups(self, request, model_admin):
        return (("open", "Open (paid, not delivered)"),)

    def queryset(self, request, queryset):
        if self.value() == "open":
            return queryset.filter(
                payment_status=Order.PaymentStatus.PAID,
            ).exclude(fulfillment_status__in=[Order.FulfillmentStatus.DELIVERED, Order.FulfillmentStatus.CANCELLED])
        return queryset


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "number", "full_name", "email", "total", "currency",
        "payment_status", "fulfillment_status", "created_at",
    )
    list_filter = (PaidOrderFilter, "fulfillment_status", "payment_status", "country", "created_at")
    search_fields = ("number", "email", "first_name", "last_name", "stripe_payment_intent_id")
    readonly_fields = (
        "number", "stripe_payment_intent_id", "subtotal", "shipping_total", "tax_total",
        "discount_total", "total", "currency", "paid_at", "anonymous_id",
        "utm_source", "utm_medium", "utm_campaign", "created_at", "updated_at",
    )
    inlines = [OrderItemInline]
    actions = ("mark_processing", "mark_shipped", "mark_delivered")
    date_hierarchy = "created_at"
    fieldsets = (
        ("Order", {"fields": ("number", "payment_status", "fulfillment_status", "tracking_number", "admin_notes")}),
        ("Customer", {"fields": ("user", "email", "phone", "marketing_opt_in")}),
        ("Shipping address", {"fields": (
            "first_name", "last_name", "address_line1", "address_line2",
            "city", "postal_code", "region", "country", "shipping_method",
        )}),
        ("Totals", {"fields": ("currency", "subtotal", "shipping_total", "tax_total", "discount_total", "total")}),
        ("Attribution", {"fields": ("anonymous_id", "utm_source", "utm_medium", "utm_campaign"), "classes": ("collapse",)}),
        ("Payment", {"fields": ("stripe_payment_intent_id", "paid_at"), "classes": ("collapse",)}),
    )

    @admin.action(description="Mark as processing")
    def mark_processing(self, request, queryset):
        queryset.update(fulfillment_status=Order.FulfillmentStatus.PROCESSING)

    @admin.action(description="Mark as shipped (and notify customer)")
    def mark_shipped(self, request, queryset):
        for order in queryset:
            order.fulfillment_status = Order.FulfillmentStatus.SHIPPED
            order.shipped_at = timezone.now()
            order.save(update_fields=["fulfillment_status", "shipped_at", "updated_at"])
            send_order_shipped_email.delay(order.id)

    @admin.action(description="Mark as delivered")
    def mark_delivered(self, request, queryset):
        queryset.update(fulfillment_status=Order.FulfillmentStatus.DELIVERED)
