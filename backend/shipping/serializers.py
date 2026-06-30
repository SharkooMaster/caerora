from rest_framework import serializers

from .models import ShippingRate, ShippingZone


class ShippingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingRate
        fields = ("id", "name", "price", "free_over", "delivery_estimate")


class ShippingZoneSerializer(serializers.ModelSerializer):
    rates = serializers.SerializerMethodField()

    class Meta:
        model = ShippingZone
        fields = ("id", "name", "countries", "currency", "rates")

    def get_rates(self, obj):
        qs = obj.rates.filter(is_active=True)
        return ShippingRateSerializer(qs, many=True).data
