from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.contrib.admin.forms import AdminAuthenticationForm
from django.core.exceptions import ValidationError

from .models import (
    Department,
    UserProfile,
    DocumentType,
    DocumentStatus,
    Document,
    AuditLog,
    ConfidentialityLevel,
    Notification,
    NotificationType,
)

from django.core.exceptions import PermissionDenied

class RoleAdminAuthenticationForm(AdminAuthenticationForm):
    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)

        # Allow Django superusers, and business-role Admin users.
        if user.is_superuser:
            return

        role = getattr(getattr(user, "profile", None), "role", None)
        if role != "Admin":
            raise ValidationError(
                "You do not have permission to access the admin panel.",
                code="no_admin_access",
            )

class EDCMAdminSite(admin.AdminSite):
    site_header = "EDCM Administration"
    site_title = "EDCM Admin"
    index_title = "EDCM Control Panel"
    login_form = RoleAdminAuthenticationForm

    def has_permission(self, request):
        """
        Limit admin access to superusers or business-role Admin.

        Important: return True/False (do not raise) so Django can render the login
        page and handle redirects correctly.
        """
        user = request.user
        if not user.is_authenticated:
            return False
        if not user.is_active:
            return False
        if user.is_superuser:
            return True
        role = getattr(getattr(user, "profile", None), "role", None)
        return bool(user.is_staff and role == "Admin")

# Use the custom admin site instance
admin_site = EDCMAdminSite(name='admin')

@admin.register(Department, site=admin_site)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)


# User Admin Configuration
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


# Unregister the default User admin if it's already registered
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass


@admin.register(User, site=admin_site)
class UserAdmin(BaseUserAdmin):
    """
    Custom user admin that surfaces profile fields and keeps Django permissions
    in sync with the business role used in the app (Employee, Manager, Admin).
    """

    inlines = (UserProfileInline,)

    list_display = (
        'username',
        'email',
        'is_staff',
        'is_superuser',
        'get_role',
        'get_position',
        'get_department',
    )
    list_filter = (
        'is_staff',
        'is_superuser',
        'profile__role',
        'profile__department',
    )

    def get_role(self, obj):
        return getattr(obj.profile, 'role', None)

    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'

    def get_department(self, obj):
        return getattr(obj.profile, 'department', None)

    get_department.short_description = 'Department'
    get_department.admin_order_field = 'profile__department'

    def get_position(self, obj):
        return getattr(obj.profile, 'position', None)

    get_position.short_description = 'Position'
    get_position.admin_order_field = 'profile__position'

    def save_model(self, request, obj, form, change):
        """
        Whenever a user is saved via the admin, align `is_staff`/`is_superuser`
        with the selected profile role:
        - Do not grant Django superuser via business roles
        - Admin / Department Chef -> staff only
        - Others -> no admin access
        """
        super().save_model(request, obj, form, change)

        profile = getattr(obj, 'profile', None)
        if not profile:
            return

        # Do not downgrade an explicit superuser created via `createsuperuser`
        if obj.is_superuser:
            obj.is_staff = True
            obj.save()
            return

        if profile.role == 'Admin':
            obj.is_staff = True
            obj.is_superuser = False
        else:
            # No admin access
            obj.is_staff = False
            obj.is_superuser = False

        obj.save()

@admin.register(DocumentType, site=admin_site)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(DocumentStatus, site=admin_site)
class DocumentStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(ConfidentialityLevel, site=admin_site)
class ConfidentialityLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(Document, site=admin_site)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'creator', 'current_owner', 'department', 'updated_at')
    list_filter = ('status', 'department', 'document_type', 'confidentiality_level')
    search_fields = ('title', 'description', 'external_reference')

@admin.register(AuditLog, site=admin_site)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'user', 'action', 'timestamp')
    readonly_fields = ('timestamp',)

@admin.register(NotificationType, site=admin_site)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(Notification, site=admin_site)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('is_read', 'notification_type')
