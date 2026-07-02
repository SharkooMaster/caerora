from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    # Optional tile image shown in the storefront "Shop by category" grid.
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    # Ordering within navigation / listings.
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ("position", "name")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(TimeStampedModel):
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    # Short tagline shown on cards.
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    # Brand story / "why trustworthy" copy block, supports basic HTML/markdown text.
    brand_copy = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)
    how_to_use = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    # Internal sourcing info — NEVER exposed through the public API. Only staff
    # can see where a product is bought/dropshipped from.
    supplier_url = models.URLField(max_length=500, blank=True)
    supplier_notes = models.TextField(blank=True)

    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ("position", "-created_at")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            i = 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def primary_image(self):
        img = self.images.order_by("position", "id").first()
        return img.image.url if img and img.image else None

    @property
    def price_from(self):
        prices = [v.price for v in self.variants.filter(is_active=True)]
        return min(prices) if prices else None

    @property
    def in_stock(self):
        return self.variants.filter(is_active=True, stock__gt=0).exists()

    @property
    def review_stats(self):
        from django.db.models import Avg, Count

        agg = self.reviews.filter(status="approved").aggregate(
            avg=Avg("rating"), count=Count("id")
        )
        return {
            "average": round(agg["avg"], 2) if agg["avg"] else 0,
            "count": agg["count"] or 0,
        }


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=200, blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductVariant(TimeStampedModel):
    """A purchasable variant of a product, e.g. a specific shade or size."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=160, help_text="e.g. 'Rose Nude' or '30ml'")
    sku = models.CharField(max_length=64, unique=True)
    # Optional swatch color for shades (hex).
    swatch_hex = models.CharField(max_length=7, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Optional original price to show a discount.",
    )
    stock = models.PositiveIntegerField(default=0)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return f"{self.product.name} - {self.name}"
