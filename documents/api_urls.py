from django.urls import path
from .api_views import (
    CustomAuthToken, DashboardStatsView, 
    DocumentListCreateView, DocumentDeleteView,
    DepartmentListCreateView, DepartmentDetailView,
    DocumentTypeListView, ConfidentialityLevelListView,
    UserListCreateView, UserDetailView
)

urlpatterns = [
    # path('auth/register/', RegisterView.as_view(), name='api_register'),  # Removed
    path('auth/login/', CustomAuthToken.as_view(), name='api_login'),
    path('dashboard/', DashboardStatsView.as_view(), name='api_dashboard'),
    path('documents/', DocumentListCreateView.as_view(), name='api_document_list'),
    path('documents/<int:pk>/', DocumentDeleteView.as_view(), name='api_document_delete'),
    path('departments/', DepartmentListCreateView.as_view(), name='api_department_list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='api_department_detail'),
    
    # User Management
    path('users/', UserListCreateView.as_view(), name='api_users'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='api_user_detail'),
]
