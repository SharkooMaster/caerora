from rest_framework import serializers

from core.utils import absolute_media_url

from .models import GalleryImage, SiteContent, Testimonial


class SiteContentSerializer(serializers.ModelSerializer):
    hero_image = serializers.SerializerMethodField()
    brand_band_image = serializers.SerializerMethodField()
    og_image = serializers.SerializerMethodField()

    class Meta:
        model = SiteContent
        fields = (
            "promo_bar_text",
            "hero_eyebrow", "hero_title", "hero_title_accent", "hero_subtitle",
            "hero_cta_label", "hero_cta_href", "hero_image",
            "brand_band_title", "brand_band_body", "brand_band_image",
            "newsletter_title", "newsletter_body",
            "og_image",
        )

    def _url(self, field):
        return absolute_media_url(self.context.get("request"), field)

    def get_hero_image(self, obj):
        return self._url(obj.hero_image)

    def get_brand_band_image(self, obj):
        return self._url(obj.brand_band_image)

    def get_og_image(self, obj):
        return self._url(obj.og_image)


class GalleryImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ("id", "image", "alt_text", "link_url", "position")

    def get_image(self, obj):
        return absolute_media_url(self.context.get("request"), obj.image)


class TestimonialSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = ("id", "author_name", "handle", "quote", "rating", "photo", "position")

    def get_photo(self, obj):
        return absolute_media_url(self.context.get("request"), obj.photo)
