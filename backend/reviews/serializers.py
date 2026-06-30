from rest_framework import serializers

from catalog.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            "id", "author_name", "rating", "title", "body",
            "is_verified_purchase", "created_at",
        )


class ReviewCreateSerializer(serializers.ModelSerializer):
    product = serializers.SlugRelatedField(
        slug_field="slug", queryset=Product.objects.filter(is_active=True)
    )

    class Meta:
        model = Review
        fields = ("product", "author_name", "author_email", "rating", "title", "body")

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def create(self, validated_data):
        # New reviews are held for moderation to keep the store trustworthy.
        validated_data["status"] = Review.Status.PENDING
        return super().create(validated_data)
