from django.http import HttpResponseNotFound


def _app_user_from_auth_cookie(request):
    """
    Resolve the currently logged-in SPA user from the DRF token stored in `edcm_auth`.
    This does NOT create a Django session; it's used only for route gating.
    """
    token_key = request.COOKIES.get("edcm_auth")
    if not token_key:
        return None

    try:
        from rest_framework.authtoken.models import Token

        token = Token.objects.select_related("user", "user__profile").get(key=token_key)
        return token.user
    except Exception:
        return None










class DepartmentGateMiddleware:
    """
    Hide `/department/` from users who are not Heads of Department (Managers).

    The SPA renders the UI, but this blocks the entry URL server-side in production.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in ("/department", "/department/"):
            session_user = getattr(request, "user", None)
            user = session_user if (session_user and session_user.is_authenticated) else _app_user_from_auth_cookie(request)

            role = getattr(getattr(user, "profile", None), "role", None) if user else None
            dept_id = getattr(getattr(user, "profile", None), "department_id", None) if user else None

            allowed = bool(user and user.is_active and role == "Manager" and dept_id)
            if not allowed:
                return HttpResponseNotFound()

        return self.get_response(request)
