from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GalleryImage, SiteContent, Testimonial
from .serializers import (
    GalleryImageSerializer,
    SiteContentSerializer,
    TestimonialSerializer,
)


class SiteContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        obj = SiteContent.load()
        return Response(SiteContentSerializer(obj, context={"request": request}).data)


class TestimonialListView(generics.ListAPIView):
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    queryset = Testimonial.objects.filter(is_active=True)


class GalleryListView(generics.ListAPIView):
    serializer_class = GalleryImageSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    queryset = GalleryImage.objects.filter(is_active=True)
