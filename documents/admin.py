from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

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

class EDCMAdminSite(admin.AdminSite):
    site_header = "EDCM Administration"
    site_title = "EDCM Admin"
    index_title = "EDCM Control Panel"

    def has_permission(self, request):
        """
        Limit admin access strictly to Admin + Department Chef (or superusers).
        """
        if not request.user.is_authenticated:
            return False

        # Default Django checks (is_active + is_staff)
        has_default_permission = super().has_permission(request)
        if not has_default_permission:
            if request.user.is_authenticated:
                raise PermissionDenied("You do not have permission to access the admin panel.")
            return False

        # Allow superusers automatically
        if request.user.is_superuser:
            return True

        profile = getattr(request.user, 'profile', None)
        if profile and profile.role in ('Admin', 'Department Chef'):
            return True

        raise PermissionDenied("You do not have permission to access the admin panel.")

# Use the custom admin site instance
admin_site = EDCMAdminSite(name='edcm_admin')

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
        - Admin -> full admin rights (staff + superuser)
        - Department Chef -> staff only (admin access, no superuser)
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
            obj.is_superuser = True
        elif profile.role == 'Department Chef':
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
