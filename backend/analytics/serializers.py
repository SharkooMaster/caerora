from rest_framework import serializers

from catalog.models import Product, ProductVariant

from .models import Event


class EventIngestSerializer(serializers.Serializer):
    event_type = serializers.CharField()
    anonymous_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
    session_id = serializers.CharField(required=False, allow_blank=True, max_length=64)
    path = serializers.CharField(required=False, allow_blank=True, max_length=500)
    referrer = serializers.CharField(required=False, allow_blank=True, max_length=500)
    product_slug = serializers.CharField(required=False, allow_blank=True)
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    value = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    currency = serializers.CharField(required=False, allow_blank=True, max_length=3)
    dwell_ms = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    utm_source = serializers.CharField(required=False, allow_blank=True, max_length=120)
    utm_medium = serializers.CharField(required=False, allow_blank=True, max_length=120)
    utm_campaign = serializers.CharField(required=False, allow_blank=True, max_length=160)
    utm_term = serializers.CharField(required=False, allow_blank=True, max_length=160)
    utm_content = serializers.CharField(required=False, allow_blank=True, max_length=160)
    order_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    meta = serializers.JSONField(required=False)

    def create(self, validated_data):
        product = None
        slug = validated_data.pop("product_slug", "")
        if slug:
            product = Product.objects.filter(slug=slug).first()
        variant = None
        variant_id = validated_data.pop("variant_id", None)
        if variant_id:
            variant = ProductVariant.objects.filter(pk=variant_id).first()

        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        return Event.objects.create(product=product, variant=variant, user=user, **validated_data)
