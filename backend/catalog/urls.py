from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, brand_list

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("brands/", brand_list, name="brand-list"),
    *router.urls,
]
