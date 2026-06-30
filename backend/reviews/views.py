from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer


class ProductReviewListView(generics.ListAPIView):
    """Approved reviews for a single product (by slug)."""

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Review.objects.filter(
            product__slug=self.kwargs["slug"], status=Review.Status.APPROVED
        )


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewCreateSerializer
    permission_classes = [AllowAny]
    queryset = Review.objects.all()
