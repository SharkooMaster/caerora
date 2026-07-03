from rest_framework import serializers

from core.utils import absolute_media_url

from .models import Category, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "position", "image", "product_count")

    def get_image(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "video", "alt_text", "position")

    def get_image(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)

    def get_video(self, obj):
        return absolute_media_url(self.context.get("request"), obj.video)


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            "id", "name", "sku", "swatch_hex", "price", "compare_at_price",
            "stock", "is_active", "image",
        )


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    price_from = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    review_stats = serializers.DictField(read_only=True)
    category = CategorySerializer(read_only=True)
    quick_variant = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "brand", "tagline", "category", "is_featured",
            "primary_image", "price_from", "in_stock", "review_stats",
            "quick_variant", "variant_count",
        )

    def get_primary_image(self, obj):
        img = obj.images.order_by("position", "id").first()
        return absolute_media_url(self.context.get("request"), img.image if img else None)

    def get_quick_variant(self, obj):
        """First purchasable variant, so cards can offer one-tap add-to-bag."""
        variant = next(
            (v for v in obj.variants.all() if v.is_active and v.stock > 0), None
        )
        if not variant:
            return None
        return {
            "id": variant.id,
            "name": variant.name,
            "price": str(variant.price),
            "compare_at_price": str(variant.compare_at_price) if variant.compare_at_price else None,
        }

    def get_variant_count(self, obj):
        return sum(1 for v in obj.variants.all() if v.is_active)


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    review_stats = serializers.DictField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "brand", "tagline", "volume", "description", "brand_copy",
            "ingredients", "how_to_use", "category", "is_featured",
            "meta_title", "meta_description", "images", "variants", "review_stats",
        )

    def get_variants(self, obj):
        qs = obj.variants.filter(is_active=True)
        return ProductVariantSerializer(qs, many=True, context=self.context).data
