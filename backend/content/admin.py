from django.contrib import admin

from .models import GalleryImage, SiteContent, Testimonial


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        # Singleton row.
        return not SiteContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ("__str__", "position", "is_active")
    list_editable = ("position", "is_active")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("author_name", "handle", "rating", "position", "is_active")
    list_editable = ("position", "is_active")
    search_fields = ("author_name", "handle", "quote")
