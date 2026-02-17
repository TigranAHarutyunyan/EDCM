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

# Brand the Django admin to match EDCM
admin.site.site_header = "EDCM Administration"
admin.site.site_title = "EDCM Admin"
admin.site.index_title = "EDCM Control Panel"


@admin.register(Department)
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


@admin.register(User)
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
        - Admin  -> full admin rights (staff + superuser)
        - Manager -> staff only (can access admin but not superuser)
        - Employee -> no staff flag (unless already a superuser)
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
        else:
            # Employee and Manager (no staff access unless manually promoted)
            obj.is_staff = False
            obj.is_superuser = False

        obj.save()

@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(DocumentStatus)
class DocumentStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(ConfidentialityLevel)
class ConfidentialityLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'creator', 'current_owner', 'department', 'updated_at')
    list_filter = ('status', 'department', 'document_type', 'confidentiality_level')
    search_fields = ('title', 'description', 'external_reference')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'user', 'action', 'timestamp')
    readonly_fields = ('timestamp',)

@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('is_read', 'notification_type')
