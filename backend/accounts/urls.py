from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    me,
    my_orders,
    newsletter_signup,
    record_consent,
    unsubscribe,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", me, name="me"),
    path("auth/orders/", my_orders, name="my-orders"),
    path("newsletter/", newsletter_signup, name="newsletter"),
    path("newsletter/unsubscribe/<uuid:token>/", unsubscribe, name="newsletter-unsubscribe"),
    path("consent/", record_consent, name="consent"),
]
