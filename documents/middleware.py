from django.http import HttpResponseNotFound


class AdminIndexGuardMiddleware:
    """
    Prevents the Django admin index (`/admin/`) from being publicly reachable.

    Django's admin login page is normally reachable to anyone at `/admin/` via a redirect to
    `/admin/login/`. This middleware blocks direct access to `/admin/` unless the user is
    already authenticated and has an allowed role.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Guard admin index and login entrypoints to avoid leaking the admin UI to everyone.
        if request.path in ("/admin", "/admin/", "/admin/login", "/admin/login/"):
            user = getattr(request, "user", None)
            if not user or not user.is_authenticated:
                return HttpResponseNotFound()

            if user.is_superuser:
                return self.get_response(request)

            profile = getattr(user, "profile", None)
            role = getattr(profile, "role", None)
            if role not in ("Admin", "Department Chef"):
                return HttpResponseNotFound()

        return self.get_response(request)
