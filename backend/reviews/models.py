from django.db import models

from catalog.models import Product
from core.models import TimeStampedModel


class Review(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    author_name = models.CharField(max_length=120)
    author_email = models.EmailField(blank=True)
    rating = models.PositiveSmallIntegerField()  # 1..5
    title = models.CharField(max_length=160, blank=True)
    body = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.rating}* by {self.author_name} on {self.product.name}"
