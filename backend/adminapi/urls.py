from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AnalyticsView,
    CampaignViewSet,
    CategoryViewSet,
    DiscountViewSet,
    GalleryViewSet,
    OrderViewSet,
    ProductImageViewSet,
    ProductViewSet,
    ReviewViewSet,
    SiteContentView,
    StaffLoginView,
    StatsView,
    SubscriberViewSet,
    TestimonialViewSet,
    VariantViewSet,
    mark_internal_device,
    staff_me,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="admin-orders")
router.register("products", ProductViewSet, basename="admin-products")
router.register("variants", VariantViewSet, basename="admin-variants")
router.register("product-images", ProductImageViewSet, basename="admin-product-images")
router.register("categories", CategoryViewSet, basename="admin-categories")
router.register("reviews", ReviewViewSet, basename="admin-reviews")
router.register("gallery", GalleryViewSet, basename="admin-gallery")
router.register("testimonials", TestimonialViewSet, basename="admin-testimonials")
router.register("subscribers", SubscriberViewSet, basename="admin-subscribers")
router.register("campaigns", CampaignViewSet, basename="admin-campaigns")
router.register("discounts", DiscountViewSet, basename="admin-discounts")

urlpatterns = [
    path("auth/login/", StaffLoginView.as_view(), name="admin-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="admin-refresh"),
    path("me/", staff_me, name="admin-me"),
    path("stats/", StatsView.as_view(), name="admin-stats"),
    path("analytics/", AnalyticsView.as_view(), name="admin-analytics"),
    path("analytics/mark-internal/", mark_internal_device, name="admin-mark-internal"),
    path("site-content/", SiteContentView.as_view(), name="admin-site-content"),
    path("", include(router.urls)),
]
