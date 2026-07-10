from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, SeasonViewSet, brand_list

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("seasons", SeasonViewSet, basename="season")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("brands/", brand_list, name="brand-list"),
    *router.urls,
]
