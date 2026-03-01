from django.http import HttpResponseNotFound


class AdminIndexGuardMiddleware:
    """
    Prevents the Django admin index (`/admin/`) from being publicly reachable.

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
    Django's admin login page is normally reachable to anyone at `/admin/` via a redirect to
    `/admin/login/`. This middleware blocks direct access to `/admin/` unless the user is
    already authenticated and has an allowed role.
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
    Django's admin login page is normally reachable to anyone at `/admin/` via a redirect to
    `/admin/login/`. This middleware blocks direct access to `/admin/` unless the user is
    already authenticated and has an allowed role.
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
    Django's admin login page is normally reachable to anyone at `/admin/` via a redirect to
    `/admin/login/`. This middleware blocks direct access to `/admin/` unless the user is
    already authenticated and has an allowed role.
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
    Django's admin login page is normally reachable to anyone at `/admin/` via a redirect to
    `/admin/login/`. This middleware blocks direct access to `/admin/` unless the user is
    already authenticated and has an allowed role.
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
        if request.path in ("/department", "/department/"):
            session_user = getattr(request, "user", None)
            user = session_user if (session_user and session_user.is_authenticated) else _app_user_from_auth_cookie(request)

            role = getattr(getattr(user, "profile", None), "role", None) if user else None
            dept_id = getattr(getattr(user, "profile", None), "department_id", None) if user else None

            allowed = bool(user and user.is_active and role == "Manager" and dept_id)
            if not allowed:
=======
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
        # Guard the admin index endpoint so it doesn't redirect anonymous users to the login page.
        # `/admin/login/` must remain reachable so real admins can actually sign in.
        if request.path in ("/admin", "/admin/"):
            user = getattr(request, "user", None)
            if not user or not user.is_authenticated:
                return HttpResponseNotFound()

            if user.is_superuser and user.is_active:
                return self.get_response(request)

            return HttpResponseNotFound()

        # If a logged-in (session) user tries to hit the login page but isn't allowed, hide it.
        if request.path in ("/admin/login", "/admin/login/"):
            user = getattr(request, "user", None)
            if user and user.is_authenticated:
                if user.is_superuser and user.is_active:
                    return self.get_response(request)

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
                return HttpResponseNotFound()

        return self.get_response(request)
