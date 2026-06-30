from django.urls import path

from .views import stripe_config, stripe_webhook

urlpatterns = [
    path("payments/webhook/", stripe_webhook, name="stripe-webhook"),
    path("payments/config/", stripe_config, name="stripe-config"),
]
