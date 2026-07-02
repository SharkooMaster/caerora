from django.urls import path

from .views import checkout, order_detail, validate_discount

urlpatterns = [
    path("checkout/", checkout, name="checkout"),
    path("discount/validate/", validate_discount, name="discount-validate"),
    path("orders/<str:number>/", order_detail, name="order-detail"),
]
