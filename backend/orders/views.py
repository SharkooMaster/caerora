from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from payments.services import create_payment_intent_for_order

from .models import Order
from .serializers import CheckoutSerializer, OrderSerializer
from .services import CheckoutError, create_order_from_payload


@api_view(["POST"])
@permission_classes([AllowAny])
def checkout(request):
    """Create a pending order and a Stripe PaymentIntent; return client_secret."""
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = dict(serializer.validated_data)
    if request.user.is_authenticated:
        payload["user"] = request.user

    try:
        order = create_order_from_payload(payload)
    except CheckoutError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    intent = create_payment_intent_for_order(order)

    return Response(
        {
            "order": OrderSerializer(order).data,
            "client_secret": intent.get("client_secret"),
            "publishable_key": intent.get("publishable_key"),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def order_detail(request, number):
    """Public order lookup by number (used by the confirmation page)."""
    try:
        order = Order.objects.prefetch_related("items").get(number=number)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)
