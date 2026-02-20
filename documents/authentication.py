from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import PermissionDenied


class CookieTokenAuthentication(TokenAuthentication):
    """
    TokenAuthentication that can also read the token from an HttpOnly cookie.

    Security note:
    - When the token comes from a cookie, the browser will automatically attach it,
      so unsafe methods require a CSRF header (double-submit) to mitigate CSRF.
    """

    cookie_name = "edcm_auth"

    def authenticate(self, request):
        # Prefer the standard Authorization header if present.
        header_auth = super().authenticate(request)
        if header_auth is not None:
            return header_auth

        token = request.COOKIES.get(self.cookie_name)
        if not token:
            return None

        # If the token is sent via cookie, require CSRF token for unsafe methods.
        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
            csrf_cookie = request.COOKIES.get("csrftoken")
            csrf_header = request.META.get("HTTP_X_CSRFTOKEN")
            if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                raise PermissionDenied("CSRF failed.")

        return self.authenticate_credentials(token)

