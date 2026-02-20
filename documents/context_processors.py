def dashboard_panel_button(request):
    """
    Optional helper for server-rendered templates.
    Returns a dict like {"label": "...", "url": "..."} or None.
    """
    user = getattr(request, "user", None)
    profile = getattr(user, "profile", None) if user and user.is_authenticated else None
    role = getattr(profile, "role", None) if profile else None

    if role == "Admin":
        return {"label": "Admin Panel", "url": "/admin/"}
    if role == "Manager":
        return {"label": "Department Panel", "url": "/department/"}
    return {"label": None, "url": None}

