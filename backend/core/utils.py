from django.conf import settings


def absolute_media_url(request, file_field):
    """Return a browser-reachable absolute URL for a media file.

    During SSR the API is called over the internal container network
    (e.g. http://backend:8000), so request.build_absolute_uri would produce
    a host the browser cannot reach. When MEDIA_PUBLIC_BASE_URL is set we use
    that public origin instead; otherwise we fall back to the request host.
    """
    if not file_field:
        return None
    url = file_field.url
    base = getattr(settings, "MEDIA_PUBLIC_BASE_URL", "")
    if base:
        return f"{base.rstrip('/')}{url}"
    if request is not None:
        return request.build_absolute_uri(url)
    return url
