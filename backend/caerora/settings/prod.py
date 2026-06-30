from .base import *  # noqa: F401,F403

DEBUG = False

# Behind nginx; trust the forwarded proto header for HTTPS detection.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE", False)  # noqa: F405
CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE", False)  # noqa: F405
SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", "0"))  # noqa: F405
SECURE_CONTENT_TYPE_NOSNIFF = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
