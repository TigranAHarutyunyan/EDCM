from django.urls import path
from .api_views import (
    HealthCheckView,
    CustomAuthToken,
    LogoutView,
    CsrfView,
    MeView,
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
    DepartmentDocumentsView,
    DepartmentEmployeesView,
    DepartmentEmployeeDeleteView,
    DepartmentDocumentOwnerUpdateView,
    DocumentAttachmentListCreateView,
    DocumentAttachmentDeleteView,
    PortalSubmitView,
    DocumentRouteToDepartmentView,
    PortalInboxListView,
    PortalStatusSyncView,
)

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='api_health'),
    #path('auth/register/', RegisterView.as_view(), name='api_register'),  # Removed
    path('csrf/', CsrfView.as_view(), name='api_csrf'),
    path('auth/me/', MeView.as_view(), name='api_me'),
    path('auth/login/', CustomAuthToken.as_view(), name='api_login'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
    path('profile/', UserProfileView.as_view(), name='api_profile'),
    path('dashboard/', DashboardStatsView.as_view(), name='api_dashboard'),
    path('documents/', DocumentListCreateView.as_view(), name='api_document_list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='api_document_detail'),
    path('documents/<int:pk>/take/', DocumentTakeView.as_view(), name='api_document_take'),
    path('documents/<int:pk>/comment/', DocumentCommentCreateView.as_view(), name='api_document_comment'),
    path('documents/<int:pk>/delete/', DocumentDeleteView.as_view(), name='api_document_delete'),
    path('documents/<int:pk>/attachments/', DocumentAttachmentListCreateView.as_view(), name='api_document_attachments'),
    path(
        'documents/<int:document_pk>/attachments/<int:pk>/',
        DocumentAttachmentDeleteView.as_view(),
        name='api_document_attachment_delete',
    ),
    path('documents/<int:pk>/route/', DocumentRouteToDepartmentView.as_view(), name='api_document_route'),
    path('portal/submit/', PortalSubmitView.as_view(), name='api_portal_submit'),
    path('departments/', DepartmentListCreateView.as_view(), name='api_department_list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='api_department_detail'),
    path('document-types/', DocumentTypeListView.as_view(), name='api_document_types'),
    path('confidentiality-levels/', ConfidentialityLevelListView.as_view(), name='api_confidentiality_levels'),
    
    # Portal Gatekeeper & Sync
    path('portal/inbox/', PortalInboxListView.as_view(), name='api_portal_inbox'),
    path('portal/sync-status/', PortalStatusSyncView.as_view(), name='api_portal_status_sync'),
    
    # User Management
    path('users/', UserListCreateView.as_view(), name='api_users'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='api_user_detail'),
    path('admin-users/', AdminUserCreateView.as_view(), name='api_admin_users'),

    # Department Chef panel
    path('department/documents/', DepartmentDocumentsView.as_view(), name='api_department_documents'),
    path('department/employees/', DepartmentEmployeesView.as_view(), name='api_department_employees'),
    path('department/employees/<int:pk>/', DepartmentEmployeeDeleteView.as_view(), name='api_department_employee_delete'),
    path('department/documents/<int:pk>/owner/', DepartmentDocumentOwnerUpdateView.as_view(), name='api_department_document_owner'),
]
