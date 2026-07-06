import csv

from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import NewsletterCampaign, NewsletterSubscriber
from analytics import funnels
from catalog.models import Category, Product, ProductImage, ProductVariant
from content.models import GalleryImage, SiteContent, Testimonial
from emails.tasks import (
    send_newsletter_campaign,
    send_newsletter_test,
    send_order_shipped_email,
)
from orders.models import DiscountCode, Order
from reviews.models import Review

from core.revalidate import trigger_storefront_revalidate

from .permissions import IsStaffUser
from .pagination import StaffPagination
from .serializers import (
    AdminCampaignSerializer,
    AdminCategorySerializer,
    AdminDiscountSerializer,
    AdminGalleryImageSerializer,
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderUpdateSerializer,
    AdminProductImageSerializer,
    AdminProductListSerializer,
    AdminProductSerializer,
    AdminReviewSerializer,
    AdminSiteContentSerializer,
    AdminSubscriberSerializer,
    AdminTestimonialSerializer,
    AdminVariantSerializer,
    StaffTokenObtainPairSerializer,
    StaffUserSerializer,
)


# ---------- Auth ----------

class StaffLoginView(TokenObtainPairView):
    serializer_class = StaffTokenObtainPairSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([IsStaffUser])
def staff_me(request):
    return Response(StaffUserSerializer(request.user).data)


class StaffViewSet(viewsets.ModelViewSet):
    """Base viewset: staff-only, larger pagination, multipart-capable."""

    permission_classes = [IsStaffUser]
    pagination_class = StaffPagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


# ---------- Orders ----------

class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaffUser]
    pagination_class = StaffPagination
    lookup_field = "number"
    filterset_fields = {"fulfillment_status": ["exact"], "payment_status": ["exact"]}
    search_fields = ("number", "email", "first_name", "last_name", "tracking_number")
    ordering_fields = ("created_at", "total")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Order.objects.all().prefetch_related("items__variant__product")

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return AdminOrderUpdateSerializer
        if self.action == "retrieve":
            return AdminOrderDetailSerializer
        return AdminOrderListSerializer

    def _detail(self, order):
        return Response(AdminOrderDetailSerializer(order, context={"request": self.request}).data)

    @action(detail=True, methods=["post"])
    def mark_processing(self, request, number=None):
        order = self.get_object()
        order.fulfillment_status = Order.FulfillmentStatus.PROCESSING
        order.save(update_fields=["fulfillment_status", "updated_at"])
        return self._detail(order)

    @action(detail=True, methods=["post"])
    def mark_shipped(self, request, number=None):
        order = self.get_object()
        tracking = request.data.get("tracking_number")
        if tracking is not None:
            order.tracking_number = tracking
        order.fulfillment_status = Order.FulfillmentStatus.SHIPPED
        order.shipped_at = timezone.now()
        order.save(update_fields=["fulfillment_status", "shipped_at", "tracking_number", "updated_at"])
        send_order_shipped_email.delay(order.id)
        return self._detail(order)

    @action(detail=True, methods=["post"])
    def mark_delivered(self, request, number=None):
        order = self.get_object()
        order.fulfillment_status = Order.FulfillmentStatus.DELIVERED
        order.save(update_fields=["fulfillment_status", "updated_at"])
        return self._detail(order)

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, number=None):
        order = self.get_object()
        order.payment_status = Order.PaymentStatus.PAID
        if not order.paid_at:
            order.paid_at = timezone.now()
        order.save(update_fields=["payment_status", "paid_at", "updated_at"])
        return self._detail(order)

    @action(detail=True, methods=["post"])
    def cancel(self, request, number=None):
        order = self.get_object()
        order.fulfillment_status = Order.FulfillmentStatus.CANCELLED
        order.save(update_fields=["fulfillment_status", "updated_at"])
        return self._detail(order)


# ---------- Catalog ----------

class RevalidateMixin:
    """Purge the storefront page cache after any write, so Studio edits
    appear on the live site immediately instead of after the ISR window."""

    def perform_create(self, serializer):
        super().perform_create(serializer)
        trigger_storefront_revalidate()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        trigger_storefront_revalidate()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        trigger_storefront_revalidate()


class ProductViewSet(RevalidateMixin, StaffViewSet):
    search_fields = ("name", "tagline", "description")
    filterset_fields = {"category__slug": ["exact"], "is_active": ["exact"], "is_featured": ["exact"]}
    ordering_fields = ("position", "created_at", "name")
    ordering = ("position", "-created_at")

    def get_queryset(self):
        return Product.objects.all().select_related("category").prefetch_related("images", "variants")

    def get_serializer_class(self):
        if self.action == "list":
            return AdminProductListSerializer
        return AdminProductSerializer


class VariantViewSet(RevalidateMixin, StaffViewSet):
    serializer_class = AdminVariantSerializer

    def get_queryset(self):
        qs = ProductVariant.objects.all().select_related("product")
        product = self.request.query_params.get("product")
        if product:
            qs = qs.filter(product_id=product)
        return qs


class ProductImageViewSet(RevalidateMixin, StaffViewSet):
    serializer_class = AdminProductImageSerializer

    def get_queryset(self):
        qs = ProductImage.objects.all()
        product = self.request.query_params.get("product")
        if product:
            qs = qs.filter(product_id=product)
        return qs


class CategoryViewSet(RevalidateMixin, StaffViewSet):
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()
    ordering = ("position", "name")


# ---------- Reviews ----------

class ReviewViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaffUser]
    pagination_class = StaffPagination
    serializer_class = AdminReviewSerializer
    filterset_fields = {"status": ["exact"], "rating": ["exact"]}
    search_fields = ("author_name", "title", "body", "product__name")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Review.objects.all().select_related("product")

    def _set_status(self, request, new_status):
        review = self.get_object()
        review.status = new_status
        review.save(update_fields=["status", "updated_at"])
        trigger_storefront_revalidate()
        return Response(AdminReviewSerializer(review).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._set_status(request, Review.Status.APPROVED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._set_status(request, Review.Status.REJECTED)


# ---------- Content ----------

class SiteContentView(APIView):
    permission_classes = [IsStaffUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        obj = SiteContent.load()
        return Response(AdminSiteContentSerializer(obj, context={"request": request}).data)

    def put(self, request):
        return self._update(request)

    def patch(self, request):
        return self._update(request)

    def _update(self, request):
        obj = SiteContent.load()
        serializer = AdminSiteContentSerializer(
            obj, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        trigger_storefront_revalidate()
        return Response(serializer.data)


class GalleryViewSet(RevalidateMixin, StaffViewSet):
    serializer_class = AdminGalleryImageSerializer
    queryset = GalleryImage.objects.all()


class TestimonialViewSet(RevalidateMixin, StaffViewSet):
    serializer_class = AdminTestimonialSerializer
    queryset = Testimonial.objects.all()


# ---------- Newsletter ----------

class SubscriberViewSet(
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaffUser]
    pagination_class = StaffPagination
    serializer_class = AdminSubscriberSerializer
    filterset_fields = {"is_active": ["exact"]}
    search_fields = ("email", "source")
    ordering = ("-created_at",)
    queryset = NewsletterSubscriber.objects.all()

    @action(detail=False, methods=["get"])
    def export(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="caerora-subscribers.csv"'
        writer = csv.writer(response)
        writer.writerow(["email", "is_active", "source", "created_at"])
        for sub in NewsletterSubscriber.objects.all().iterator():
            writer.writerow([sub.email, sub.is_active, sub.source, sub.created_at.isoformat()])
        return response


class CampaignViewSet(StaffViewSet):
    serializer_class = AdminCampaignSerializer
    queryset = NewsletterCampaign.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status == NewsletterCampaign.Status.SENT:
            return Response({"detail": "Campaign already sent."}, status=status.HTTP_400_BAD_REQUEST)
        campaign.status = NewsletterCampaign.Status.SENDING
        campaign.save(update_fields=["status", "updated_at"])
        send_newsletter_campaign.delay(campaign.id)
        return Response({"detail": "Sending started."})

    @action(detail=True, methods=["post"])
    def test(self, request, pk=None):
        campaign = self.get_object()
        email = request.data.get("email")
        if not email:
            return Response({"detail": "email is required."}, status=status.HTTP_400_BAD_REQUEST)
        send_newsletter_test.delay(campaign.id, email)
        return Response({"detail": f"Test sent to {email}."})


# ---------- Discounts ----------

class DiscountViewSet(StaffViewSet):
    serializer_class = AdminDiscountSerializer
    queryset = DiscountCode.objects.all()
    filterset_fields = {"is_active": ["exact"]}
    search_fields = ("code",)
    ordering = ("-created_at",)


# ---------- Dashboard ----------

class StatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        today = timezone.now().date()
        paid = Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
        open_fulfillment = paid.exclude(
            fulfillment_status__in=[
                Order.FulfillmentStatus.DELIVERED,
                Order.FulfillmentStatus.CANCELLED,
            ]
        ).count()
        recent = Order.objects.all().prefetch_related("items")[:8]
        return Response({
            "orders_total": Order.objects.count(),
            "orders_today": Order.objects.filter(created_at__date=today).count(),
            "revenue_total": paid.aggregate(s=Sum("total"))["s"] or 0,
            "open_fulfillment": open_fulfillment,
            "pending_reviews": Review.objects.filter(status=Review.Status.PENDING).count(),
            "subscribers": NewsletterSubscriber.objects.filter(is_active=True).count(),
            "products": Product.objects.count(),
            "low_stock": ProductVariant.objects.filter(is_active=True, stock__lte=5).count(),
            "recent_orders": AdminOrderListSerializer(recent, many=True, context={"request": request}).data,
        })


@api_view(["POST"])
@permission_classes([IsStaffUser])
def mark_internal_device(request):
    """Register the caller's tracker device id as internal (team) traffic.

    The Studio calls this on load, so anyone who uses the admin panel stops
    polluting the shopper analytics from that device onward (historic events
    from the device are excluded too, since filtering happens at query time).
    """
    from analytics.models import InternalDevice

    anon = str(request.data.get("anonymous_id") or "").strip()[:64]
    if not anon:
        return Response({"detail": "anonymous_id required"}, status=status.HTTP_400_BAD_REQUEST)
    _, created = InternalDevice.objects.get_or_create(
        anonymous_id=anon, defaults={"note": f"studio: {request.user.get_username()}"}
    )
    return Response({"ok": True, "created": created})


class AnalyticsView(APIView):
    """First-party behaviour analytics for the Studio dashboard."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        from analytics.models import InternalDevice

        try:
            days = max(1, min(int(request.query_params.get("days", 7)), 90))
        except (TypeError, ValueError):
            days = 7
        summary = funnels.funnel_summary(days)
        return Response({
            "days": days,
            "internal_devices": InternalDevice.objects.count(),
            "kpis": summary["kpis"],
            "session_funnel": funnels.session_funnel(days),
            "timeseries": funnels.timeseries(days),
            "top_pages": funnels.top_pages(days),
            "browse_depth": funnels.browse_depth(days),
            "top_products": funnels.top_products(days),
            "sources": funnels.attribution_breakdown(days),
            "recent_activity": funnels.recent_activity(),
        })
