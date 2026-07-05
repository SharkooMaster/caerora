import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PUSHOVER_URL = "https://api.pushover.net/1/messages.json"


def notify(title: str, message: str, priority: int = 0, url: str = "", url_title: str = ""):
    """Send a Pushover notification to the shop owner.

    Never raises: failures are logged so callers (checkout webhook, signup)
    are unaffected. Skips silently when Pushover isn't configured.
    """
    token = settings.PUSHOVER_APP_TOKEN
    user = settings.PUSHOVER_USER_KEY
    if not token or not user:
        logger.info("[pushover:skipped not configured] %s", title)
        return

    payload = {
        "token": token,
        "user": user,
        "title": title,
        "message": message,
        "priority": priority,
    }
    if url:
        payload["url"] = url
        payload["url_title"] = url_title or url

    try:
        resp = requests.post(PUSHOVER_URL, data=payload, timeout=5)
        if resp.status_code != 200:
            logger.error("Pushover rejected notification %r: %s", title, resp.text[:300])
    except requests.RequestException as exc:
        logger.error("Pushover notification %r failed: %s", title, exc)
