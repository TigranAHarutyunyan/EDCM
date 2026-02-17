from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    # parent_department support could be added here if needed
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('Employee', 'Employee'),
        ('Manager', 'Manager'),
        ('Department Chef', 'Department Chef'),
        ('Admin', 'Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    full_name = models.CharField(max_length=150, blank=True)
    # Human-readable job title/position inside the company (e.g. \"HR Specialist\")
    position = models.CharField(max_length=150, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.user.username

class DocumentType(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True, default='OTHER')

    def __str__(self):
        return self.name

class DocumentStatus(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, default='DRAFT')

    def __str__(self):
        return self.name

class ConfidentialityLevel(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True) # Mapped to 'summary' in schema.sql logic
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    status = models.ForeignKey(DocumentStatus, on_delete=models.PROTECT)
    confidentiality_level = models.ForeignKey(ConfidentialityLevel, on_delete=models.PROTECT, null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_documents')
    current_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_documents')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_documents')
    
    external_reference = models.CharField(max_length=100, blank=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class NotificationType(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.ForeignKey(NotificationType, on_delete=models.PROTECT)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Simple JSON-like text field for payload if JSONField isn't strictly needed for querying
    payload = models.TextField(blank=True, null=True) 

    def __str__(self):
        return f"{self.notification_type} for {self.user}"

# Renaming AuditLog to ActivityLog to match concept, but keeping class name AuditLog for now to minimize breakage in views
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=100) # Mapping to action_type.code or name
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.document.title} - {self.action}"

class DocumentComment(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.document}"

# Signals
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

@receiver(post_save, sender=UserProfile)
def sync_user_admin_flags(sender, instance, **kwargs):
    """
    Ensure User.is_staff and User.is_superuser strictly match the UserProfile.role.
    - Admin: Staff + Superuser
    - Others: No Admin Panel access
    """
    user = instance.user
    should_be_staff = (instance.role == 'Admin')
    should_be_superuser = (instance.role == 'Admin')

    # We only update if there's a mismatch to avoid unnecessary saves/recursion
    if user.is_staff != should_be_staff or user.is_superuser != should_be_superuser:
        # Use update() to avoid triggering User's post_save again and recursion
        User.objects.filter(pk=user.pk).update(
            is_staff=should_be_staff,
            is_superuser=should_be_superuser
        )
