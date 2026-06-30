import logging

import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(to, subject, html, reply_to=None):
    """Send a transactional email through Resend.

    Falls back to logging when no API key is configured (local dev).
    """
    if not settings.RESEND_API_KEY:
        logger.info("[email:skipped no RESEND_API_KEY] to=%s subject=%s", to, subject)
        return None

    resend.api_key = settings.RESEND_API_KEY
    params = {
        "from": settings.EMAIL_FROM,
        "to": [to] if isinstance(to, str) else to,
        "subject": subject,
        "html": html,
    }
    if reply_to:
        params["reply_to"] = reply_to
    try:
        return resend.Emails.send(params)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send email to %s: %s", to, exc)
        return None
