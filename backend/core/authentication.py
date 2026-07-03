from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """SessionAuthentication without DRF's CSRF enforcement.

    The storefront API is anonymous and Studio authenticates with JWT Bearer
    tokens, so no client sends a CSRF token. Without this, a stray Django
    admin session cookie in the browser makes public POSTs (checkout,
    reviews, newsletter) fail with "CSRF Failed". Session cookies are
    SameSite=Lax, which keeps cross-site request forgery blocked at the
    cookie level.
    """

    def enforce_csrf(self, request):
        return
