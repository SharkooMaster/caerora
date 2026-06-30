from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from core.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health"),
    path("api/", include("catalog.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("shipping.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
