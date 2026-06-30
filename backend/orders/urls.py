from django.urls import path

from .views import checkout, order_detail

urlpatterns = [
    path("checkout/", checkout, name="checkout"),
    path("orders/<str:number>/", order_detail, name="order-detail"),
]
