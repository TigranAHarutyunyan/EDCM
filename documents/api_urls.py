from django.urls import path
from .api_views import (
    CustomAuthToken, DashboardStatsView, 
    DocumentListCreateView, DepartmentListView, 
    DocumentTypeListView, ConfidentialityLevelListView,
    UserListCreateView, UserDeleteView
)

urlpatterns = [
    # path('auth/register/', RegisterView.as_view(), name='api_register'),  # Removed
    path('auth/login/', CustomAuthToken.as_view(), name='api_login'),
    path('dashboard/', DashboardStatsView.as_view(), name='api_dashboard'),
    path('documents/', DocumentListCreateView.as_view(), name='api_document_list'),
    path('departments/', DepartmentListView.as_view(), name='api_department_list'),
    path('document-types/', DocumentTypeListView.as_view(), name='api_document_type_list'),
    path('confidentiality-levels/', ConfidentialityLevelListView.as_view(), name='api_confidentiality_level_list'),
    
    # Admin User Management
    path('admin/users/', UserListCreateView.as_view(), name='api_admin_users'),
    path('admin/users/<int:pk>/', UserDeleteView.as_view(), name='api_admin_user_delete'),
]
