from django.urls import path

from .views import shipping_options, shipping_zones

urlpatterns = [
    path("shipping/zones/", shipping_zones, name="shipping-zones"),
    path("shipping/options/", shipping_options, name="shipping-options"),
]
