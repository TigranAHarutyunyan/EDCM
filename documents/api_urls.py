from django.urls import path
from .api_views import (
    HealthCheckView,
    CustomAuthToken,
    LogoutView,
    CsrfView,
    DashboardStatsView,
    DocumentListCreateView,
    DocumentDeleteView,
    DocumentDetailView,
    DocumentTakeView,
    DocumentCommentCreateView,
    DepartmentListCreateView,
    DepartmentDetailView,
    DocumentTypeListView,
    ConfidentialityLevelListView,
    UserListCreateView,
    UserDetailView,
    AdminUserCreateView,
    UserProfileView,
)

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='api_health'),
    #path('auth/register/', RegisterView.as_view(), name='api_register'),  # Removed
    path('csrf/', CsrfView.as_view(), name='api_csrf'),
    path('auth/login/', CustomAuthToken.as_view(), name='api_login'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('profile/', UserProfileView.as_view(), name='api_profile'),
    path('dashboard/', DashboardStatsView.as_view(), name='api_dashboard'),
    path('documents/', DocumentListCreateView.as_view(), name='api_document_list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='api_document_detail'),
    path('documents/<int:pk>/take/', DocumentTakeView.as_view(), name='api_document_take'),
    path('documents/<int:pk>/comment/', DocumentCommentCreateView.as_view(), name='api_document_comment'),
    path('documents/<int:pk>/delete/', DocumentDeleteView.as_view(), name='api_document_delete'),
    path('departments/', DepartmentListCreateView.as_view(), name='api_department_list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='api_department_detail'),
    path('document-types/', DocumentTypeListView.as_view(), name='api_document_types'),
    path('confidentiality-levels/', ConfidentialityLevelListView.as_view(), name='api_confidentiality_levels'),
    
    # User Management
    path('users/', UserListCreateView.as_view(), name='api_users'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='api_user_detail'),
    path('admin-users/', AdminUserCreateView.as_view(), name='api_admin_users'),
]
