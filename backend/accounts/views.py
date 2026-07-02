from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from orders.models import Order
from orders.serializers import OrderSerializer

from .models import ConsentRecord, NewsletterSubscriber
from .serializers import (
    ConsentSerializer,
    NewsletterSerializer,
    RegisterSerializer,
    UserSerializer,
)


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).prefetch_related("items")
    return Response(OrderSerializer(orders, many=True).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def newsletter_signup(request):
    serializer = NewsletterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    NewsletterSubscriber.objects.update_or_create(
        email=email,
        defaults={"is_active": True, "source": serializer.validated_data.get("source", "")},
    )
    # Record marketing consent for GDPR audit trail.
    ConsentRecord.objects.create(
        kind=ConsentRecord.Kind.MARKETING,
        email=email,
        granted=True,
        marketing=True,
        ip_address=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
    )
    return Response({"detail": "Subscribed."}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def unsubscribe(request, token):
    from django.http import HttpResponse

    updated = NewsletterSubscriber.objects.filter(unsubscribe_token=token).update(is_active=False)
    message = (
        "You have been unsubscribed. We are sorry to see you go."
        if updated
        else "This unsubscribe link is no longer valid."
    )
    html = (
        "<html><body style=\"font-family:Georgia,serif;background:#FAF7F4;color:#2B2424;"
        "text-align:center;padding:80px 20px;\">"
        "<div style=\"font-size:26px;letter-spacing:6px;color:#5B3B4A;font-weight:600;\">CAERORA</div>"
        f"<p style=\"margin-top:24px;font-size:16px;\">{message}</p></body></html>"
    )
    return HttpResponse(html)


@api_view(["POST"])
@permission_classes([AllowAny])
def record_consent(request):
    serializer = ConsentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    ConsentRecord.objects.create(
        user=request.user if request.user.is_authenticated else None,
        ip_address=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
        **serializer.validated_data,
    )
    return Response({"detail": "Consent recorded."}, status=status.HTTP_201_CREATED)
