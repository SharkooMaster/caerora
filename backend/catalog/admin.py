from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, ProductVariant, Season


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("number", "name", "subtitle", "act", "is_active")
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "subtitle", "act")
    ordering = ("number",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "position", "is_active")
    list_editable = ("position", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "preview", "alt_text", "position")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj and obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:6px;" />', obj.image.url)
        return "-"


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ("name", "sku", "swatch_hex", "price", "compare_at_price", "stock", "position", "is_active")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price_from", "is_active", "is_featured", "in_stock")
    list_filter = ("is_active", "is_featured", "category")
    list_editable = ("is_active", "is_featured")
    search_fields = ("name", "tagline", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        (None, {"fields": ("name", "slug", "category", "tagline", "is_active", "is_featured", "position")}),
        ("Content", {"fields": ("description", "brand_copy", "ingredients", "how_to_use")}),
        ("SEO", {"fields": ("meta_title", "meta_description"), "classes": ("collapse",)}),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "name", "price", "stock", "is_active")
    list_filter = ("is_active",)
    search_fields = ("sku", "name", "product__name")
