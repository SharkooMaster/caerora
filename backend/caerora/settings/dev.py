from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Allow any localhost-ish origin in development.
CORS_ALLOW_ALL_ORIGINS = True
