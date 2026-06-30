from django.urls import path

from .views import ProductReviewListView, ReviewCreateView

urlpatterns = [
    path("products/<slug:slug>/reviews/", ProductReviewListView.as_view(), name="product-reviews"),
    path("reviews/", ReviewCreateView.as_view(), name="review-create"),
]
