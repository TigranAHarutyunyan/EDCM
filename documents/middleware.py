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

                return HttpResponseNotFound()

        return self.get_response(request)
