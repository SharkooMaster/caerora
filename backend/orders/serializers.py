from rest_framework import serializers

from .models import Order, OrderItem


class CheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=120)
    last_name = serializers.CharField(max_length=120)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(required=False, allow_blank=True, max_length=255)
    city = serializers.CharField(max_length=120)
    postal_code = serializers.CharField(max_length=40)
    region = serializers.CharField(required=False, allow_blank=True, max_length=120)
    country = serializers.CharField(max_length=2)
    shipping_rate_id = serializers.IntegerField(required=False, allow_null=True)
    items = CheckoutItemSerializer(many=True)
    marketing_opt_in = serializers.BooleanField(required=False, default=False)
    discount_code = serializers.CharField(required=False, allow_blank=True, max_length=40)
    # Attribution
    anonymous_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
    utm_source = serializers.CharField(required=False, allow_blank=True, max_length=120)
    utm_medium = serializers.CharField(required=False, allow_blank=True, max_length=120)
    utm_campaign = serializers.CharField(required=False, allow_blank=True, max_length=160)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("product_name", "variant_name", "sku", "unit_price", "quantity", "line_total")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "number", "email", "first_name", "last_name",
            "address_line1", "address_line2", "city", "postal_code", "region", "country",
            "currency", "subtotal", "shipping_total", "tax_total", "discount_total", "total",
            "shipping_method", "payment_status", "fulfillment_status", "tracking_number",
            "discount_code", "created_at", "items",
        )
