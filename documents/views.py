from django.shortcuts import render
from django.http import HttpResponseNotFound


def _app_user_from_auth_cookie(request):
    """
    Resolve the SPA-authenticated user (DRF token in HttpOnly cookie) without
    relying on Django sessions.
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

# React App View
def react_app(request):
    """Serve the React application"""
    return render(request, 'index.html')


def department_entry(request):
    """
    Entry point for the Department Panel SPA route.
    Only Heads of Department (Managers) can access `/department/`.
    """
    user = request.user if request.user.is_authenticated else _app_user_from_auth_cookie(request)
    role = getattr(getattr(user, "profile", None), "role", None) if user else None
    dept_id = getattr(getattr(user, "profile", None), "department_id", None) if user else None

    if user and user.is_active and role == "Manager" and dept_id:
        return render(request, "index.html")

    return HttpResponseNotFound()
