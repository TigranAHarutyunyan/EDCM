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

from django.http import JsonResponse

# React App View (Now just an API entry point in Production)
def react_app(request):
    """Entry point for the API backend"""
    return JsonResponse({
        "status": "online",
        "message": "EDCM Backend API is running",
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/",
            "frontend": "http://localhost:5173"
        }
    })


def department_entry(request):
    """
    Entry point for the Department Panel SPA route.
    Only Heads of Department (Managers) can access `/department/`.
    """
    user = request.user if request.user.is_authenticated else _app_user_from_auth_cookie(request)
    role = getattr(getattr(user, "profile", None), "role", None) if user else None
    dept_id = getattr(getattr(user, "profile", None), "department_id", None) if user else None

    if user and user.is_active and role == "Manager" and dept_id:
        return JsonResponse({
            "status": "ready",
            "message": "Authorized. Please use the Department Panel in the Frontend."
        })

    return HttpResponseNotFound()
