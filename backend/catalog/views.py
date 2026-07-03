from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = {"category__slug": ["exact"], "is_featured": ["exact"], "brand": ["exact"]}
    search_fields = ("name", "brand", "tagline", "description")
    ordering_fields = ("created_at", "position", "name")

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images", "variants", "reviews")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def brand_list(request):
    """Distinct brands across active products, with product counts."""
    rows = (
        Product.objects.filter(is_active=True)
        .exclude(brand="")
        .values("brand")
        .annotate(count=Count("id"))
        .order_by("brand")
    )
    return Response([{"name": r["brand"], "count": r["count"]} for r in rows])
