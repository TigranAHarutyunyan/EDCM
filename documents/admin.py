from django.contrib import admin
from .models import Department, UserProfile, DocumentType, DocumentStatus, Document, AuditLog, ConfidentialityLevel, Notification, NotificationType

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

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

# Define a new User admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

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

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('is_read', 'notification_type')
