from django.urls import path

from .views import GalleryListView, SiteContentView, TestimonialListView

urlpatterns = [
    path("site-content/", SiteContentView.as_view(), name="site-content"),
    path("testimonials/", TestimonialListView.as_view(), name="testimonials"),
    path("gallery/", GalleryListView.as_view(), name="gallery"),
]
