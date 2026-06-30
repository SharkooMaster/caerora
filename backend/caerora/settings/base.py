"""Base Django settings for the Caerora project."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load a local .env if present (no-op in Docker where env is injected).
load_dotenv(BASE_DIR.parent / ".env")


def env(key, default=None):
    return os.environ.get(key, default)


def env_bool(key, default=False):
    val = os.environ.get(key)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def env_list(key, default=None):
    val = os.environ.get(key)
    if not val:
        return list(default or [])
    return [item.strip() for item in val.split(",") if item.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1"])

SITE_URL = env("SITE_URL", "http://localhost")
FRONTEND_ORIGIN = env("FRONTEND_ORIGIN", "http://localhost:3000")
# Public origin where the backend (and its /media, /admin) is reachable by the
# browser. Used so the admin CSRF and media URLs work across split origins.
BACKEND_ORIGIN = env("BACKEND_ORIGIN", "")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    "django_filters",
    # Local apps
    "core",
    "catalog",
    "reviews",
    "shipping",
    "orders",
    "payments",
    "emails",
    "accounts",
    "analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files directly from the app process,
    # so /django-static works without a shared static volume or a CDN.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "caerora.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "caerora.wsgi.application"
ASGI_APPLICATION = "caerora.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", "caerora"),
        "USER": env("POSTGRES_USER", "caerora"),
        "PASSWORD": env("POSTGRES_PASSWORD", "caerora"),
        "HOST": env("POSTGRES_HOST", "localhost"),
        "PORT": env("POSTGRES_PORT", "5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# WhiteNoise: compress static files (gzip) but skip the hashed manifest so a
# missing reference in third-party CSS can never break startup.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
# Public base URL for media so SSR-built image URLs are browser-reachable.
MEDIA_PUBLIC_BASE_URL = env("MEDIA_PUBLIC_BASE_URL", "")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- DRF ----
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
}

from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
}

# ---- CORS / CSRF ----
_origins = {FRONTEND_ORIGIN, SITE_URL, *env_list("CORS_EXTRA_ORIGINS", [])}
if BACKEND_ORIGIN:
    _origins.add(BACKEND_ORIGIN)
CORS_ALLOWED_ORIGINS = [o for o in _origins if o]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [o for o in _origins if o]

# ---- Celery ----
CELERY_BROKER_URL = env("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", False)
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]

# ---- Stripe ----
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = env("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", "")
STRIPE_DEFAULT_CURRENCY = env("STRIPE_DEFAULT_CURRENCY", "eur")

# ---- Resend / email ----
RESEND_API_KEY = env("RESEND_API_KEY", "")
EMAIL_FROM = env("EMAIL_FROM", "Caerora <hello@caerora.com>")
ADMIN_NOTIFICATION_EMAIL = env("ADMIN_NOTIFICATION_EMAIL", "orders@caerora.com")

# ---- Marketing / analytics (server-side) ----
META_CAPI_ACCESS_TOKEN = env("META_CAPI_ACCESS_TOKEN", "")
META_CAPI_PIXEL_ID = env("META_CAPI_PIXEL_ID", "")
GA4_API_SECRET = env("GA4_API_SECRET", "")
GA4_MEASUREMENT_ID = env("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "")
