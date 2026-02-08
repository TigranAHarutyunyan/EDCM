from django.urls import path, re_path
from . import views

urlpatterns = [
    # Catch-all: serve React app for all routes
    # API routes are handled in config/urls.py under /api/
    # Admin routes are handled in config/urls.py under /admin/
    re_path(r'^.*$', views.react_app, name='react_app'),
]
