from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import NewsletterCampaign, NewsletterSubscriber
from catalog.models import Category, Product, ProductImage, ProductVariant
from content.models import GalleryImage, SiteContent, Testimonial
from core.utils import absolute_media_url
from orders.models import DiscountCode, Order, OrderItem
from reviews.models import Review

User = get_user_model()


class StaffTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login serializer that only issues tokens to staff users."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_staff:
            raise serializers.ValidationError("This account does not have staff access.")
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser,
        }
        return data


class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser")


# ---------- Orders ----------

class AdminOrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    supplier_url = serializers.SerializerMethodField()
    supplier_cost = serializers.SerializerMethodField()
    supplier_notes = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id", "product_name", "variant_name", "sku", "unit_price", "quantity", "line_total",
            "supplier_url", "supplier_cost", "supplier_notes",
        )

    def _product(self, obj):
        return obj.variant.product if obj.variant_id else None

    def get_supplier_url(self, obj):
        product = self._product(obj)
        return product.supplier_url if product else ""

    def get_supplier_cost(self, obj):
        product = self._product(obj)
        return str(product.supplier_cost) if product and product.supplier_cost is not None else None

    def get_supplier_notes(self, obj):
        product = self._product(obj)
        return product.supplier_notes if product else ""


class AdminOrderListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "number", "full_name", "email", "total", "currency",
            "payment_status", "fulfillment_status", "tracking_number",
            "item_count", "created_at",
        )

    def get_item_count(self, obj):
        return sum(i.quantity for i in obj.items.all())


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "number", "full_name", "email", "phone",
            "first_name", "last_name", "address_line1", "address_line2",
            "city", "postal_code", "region", "country",
            "currency", "subtotal", "shipping_total", "tax_total", "discount_total", "total",
            "discount_code", "shipping_method", "payment_status", "fulfillment_status",
            "paid_at", "shipped_at", "tracking_number", "admin_notes",
            "stripe_payment_intent_id", "marketing_opt_in",
            "utm_source", "utm_medium", "utm_campaign",
            "items", "created_at", "updated_at",
        )
        read_only_fields = (
            "number", "subtotal", "shipping_total", "tax_total", "discount_total",
            "total", "currency", "stripe_payment_intent_id", "paid_at", "shipped_at",
            "created_at", "updated_at",
        )


class AdminOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("fulfillment_status", "payment_status", "tracking_number", "admin_notes")


# ---------- Catalog ----------

class AdminVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            "id", "product", "name", "sku", "swatch_hex", "price",
            "compare_at_price", "stock", "position", "is_active",
        )
        extra_kwargs = {"product": {"required": False}}


class AdminProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "product", "image", "image_url", "alt_text", "position")
        extra_kwargs = {"image": {"write_only": True, "required": False}, "product": {"required": False}}

    def get_image_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)


class AdminCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id", "name", "slug", "description", "image", "image_url",
            "position", "is_active", "product_count",
        )
        extra_kwargs = {
            "slug": {"required": False},
            "image": {"write_only": True, "required": False},
        }

    def get_image_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)

    def get_product_count(self, obj):
        return obj.products.count()


class AdminProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", default="", read_only=True)
    primary_image = serializers.SerializerMethodField()
    price_from = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    variant_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "tagline", "category", "category_name",
            "is_active", "is_featured", "position", "primary_image",
            "price_from", "in_stock", "variant_count",
        )

    def get_primary_image(self, obj):
        img = obj.images.order_by("position", "id").first()
        return absolute_media_url(self.context.get("request"), img.image if img else None)

    def get_variant_count(self, obj):
        return obj.variants.count()


class AdminProductSerializer(serializers.ModelSerializer):
    variants = AdminVariantSerializer(many=True, read_only=True)
    images = AdminProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "category", "name", "slug", "tagline", "description",
            "brand_copy", "ingredients", "how_to_use",
            "is_active", "is_featured", "position",
            "supplier_url", "supplier_notes", "supplier_cost",
            "meta_title", "meta_description",
            "variants", "images", "primary_image",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def get_primary_image(self, obj):
        img = obj.images.order_by("position", "id").first()
        return absolute_media_url(self.context.get("request"), img.image if img else None)


# ---------- Reviews ----------

class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id", "product", "product_name", "product_slug", "author_name",
            "author_email", "rating", "title", "body", "is_verified_purchase",
            "status", "created_at",
        )
        read_only_fields = ("product", "author_name", "author_email", "rating", "title", "body", "created_at")


# ---------- Content ----------

class AdminSiteContentSerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    brand_band_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteContent
        fields = (
            "promo_bar_text",
            "hero_eyebrow", "hero_title", "hero_title_accent", "hero_subtitle",
            "hero_cta_label", "hero_cta_href", "hero_image", "hero_image_url",
            "brand_band_title", "brand_band_body", "brand_band_image", "brand_band_image_url",
            "newsletter_title", "newsletter_body",
            "og_image", "og_image_url",
        )
        extra_kwargs = {
            "hero_image": {"write_only": True, "required": False},
            "brand_band_image": {"write_only": True, "required": False},
            "og_image": {"write_only": True, "required": False},
        }

    def _url(self, field):
        return absolute_media_url(self.context.get("request"), field)

    def get_hero_image_url(self, obj):
        return self._url(obj.hero_image)

    def get_brand_band_image_url(self, obj):
        return self._url(obj.brand_band_image)

    def get_og_image_url(self, obj):
        return self._url(obj.og_image)


class AdminGalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ("id", "image", "image_url", "alt_text", "link_url", "position", "is_active")
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)


class AdminTestimonialSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = (
            "id", "author_name", "handle", "quote", "rating", "photo", "photo_url",
            "position", "is_active",
        )
        extra_kwargs = {"photo": {"write_only": True, "required": False}}

    def get_photo_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.photo)


# ---------- Newsletter ----------

class AdminSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ("id", "email", "is_active", "source", "created_at")


class AdminCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterCampaign
        fields = (
            "id", "subject", "preheader", "body_html", "status",
            "scheduled_at", "sent_at", "recipients_count", "created_at",
        )
        read_only_fields = ("status", "sent_at", "recipients_count", "created_at")


# ---------- Discounts ----------

class AdminDiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = (
            "id", "code", "percent_off", "is_active",
            "starts_at", "ends_at", "max_uses", "used_count",
            "min_subtotal", "created_at",
        )
        read_only_fields = ("used_count", "created_at")

    def validate_percent_off(self, value):
        if not 1 <= value <= 100:
            raise serializers.ValidationError("Percent off must be between 1 and 100.")
        return value
