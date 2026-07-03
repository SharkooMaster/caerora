import logging
import threading

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _post():
    try:
        requests.post(
            f"{settings.FRONTEND_INTERNAL_URL}/api/revalidate",
            headers={"x-revalidate-secret": settings.REVALIDATE_SECRET},
            timeout=5,
        )
    except Exception:  # noqa: BLE001 - best effort, never break the admin request
        logger.warning("Storefront revalidate ping failed", exc_info=True)


def trigger_storefront_revalidate() -> None:
    """Fire-and-forget cache purge so Studio edits show on the site instantly."""
    if not settings.REVALIDATE_SECRET:
        return
    threading.Thread(target=_post, daemon=True).start()
