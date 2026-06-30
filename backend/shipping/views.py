from decimal import Decimal

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ShippingZone
from .serializers import ShippingRateSerializer, ShippingZoneSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def shipping_zones(request):
    zones = ShippingZone.objects.filter(is_active=True)
    return Response(ShippingZoneSerializer(zones, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def shipping_options(request):
    """Return available shipping rates for a country + subtotal, with effective price."""
    country = request.query_params.get("country", "")
    try:
        subtotal = Decimal(request.query_params.get("subtotal", "0"))
    except Exception:
        subtotal = Decimal("0")

    zone = ShippingZone.for_country(country)
    if not zone:
        return Response({"zone": None, "currency": "eur", "rates": []})

    rates = []
    for rate in zone.rates.filter(is_active=True):
        data = ShippingRateSerializer(rate).data
        data["effective_price"] = str(rate.effective_price(subtotal))
        rates.append(data)

    return Response({"zone": zone.name, "currency": zone.currency, "rates": rates})
