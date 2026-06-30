from django.contrib import admin

from .models import ShippingRate, ShippingZone


class ShippingRateInline(admin.TabularInline):
    model = ShippingRate
    extra = 1


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "countries", "currency", "position", "is_active")
    list_editable = ("position", "is_active")
    inlines = [ShippingRateInline]


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ("zone", "name", "price", "free_over", "delivery_estimate", "is_active")
    list_filter = ("zone", "is_active")
