from rest_framework import generics,serializers
from django.contrib.auth.models import User
from .models import (
    Document,
    Department,
    UserProfile,
    DocumentType,
    DocumentStatus,
    ConfidentialityLevel,
    DocumentComment,
    AuditLog,
    DocumentAttachment,
    PortalSubmission,
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description']

class UserProfileSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['role', 'full_name', 'position', 'department', 'profile_picture', 'bio']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(write_only=True, required=False)
    position = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        write_only=True,
        required=False,
        default='Employee',
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'profile',
            'password',
            'full_name',
            'position',
            'role',
            'department_id',
        ]

    def create(self, validated_data):
        """
        Create a new user and align Django admin flags with the business role
        using the shared utility function.
        """
        from .utils import create_user_with_profile
        
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', '')
        position = validated_data.pop('position', '')
        role = validated_data.pop('role', 'Employee')
        department = validated_data.pop('department_id', None)
        username = validated_data.pop('username')
        email = validated_data.pop('email', '')

        user = create_user_with_profile(
            username=username,
            password=password,
            email=email,
            role=role,
            full_name=full_name,
            position=position,
            department=department
        )

        return user


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'code']

class DocumentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentStatus
        fields = ['id', 'name', 'code']

class ConfidentialityLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfidentialityLevel
        fields = ['id', 'name', 'code']

class DocumentCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DocumentComment
        fields = ['id', 'user', 'text', 'created_at']
        read_only_fields = ['user', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'timestamp', 'details']


class DocumentAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DocumentAttachment
        fields = [
            "id",
            "file",
            "original_name",
            "content_type",
            "size",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = [
            "original_name",
            "content_type",
            "size",
            "uploaded_by",
            "created_at",
        ]

    def get_uploaded_by(self, obj):
        if not obj.uploaded_by_id:
            return None
        return {"id": obj.uploaded_by_id, "username": obj.uploaded_by.username}


class PortalSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalSubmission
        fields = [
            "client_name",
            "client_email",
            "client_phone",
            "company",
            "created_at",
        ]

class DocumentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    current_owner = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    document_type_details = DocumentTypeSerializer(source='document_type', read_only=True)
    status_details = DocumentStatusSerializer(source='status', read_only=True)
    confidentiality_level_details = ConfidentialityLevelSerializer(source='confidentiality_level', read_only=True)
    comments = DocumentCommentSerializer(many=True, read_only=True)
    history = AuditLogSerializer(source='audit_logs', many=True, read_only=True)
    attachments = DocumentAttachmentSerializer(many=True, read_only=True)
    portal_submission = PortalSubmissionSerializer(read_only=True)

    # Write-only field for creation (frontend sends `document_type` id)
    document_type = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all(), write_only=True
    )
    confidentiality_level = serializers.SlugRelatedField(
        queryset=ConfidentialityLevel.objects.all(), 
        slug_field='code', 
        write_only=True, 
        required=False
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'created_at', 'updated_at', 'due_date',
            'external_reference', 'creator', 'current_owner', 'department', 'assigned_to',
            'document_type_details', 'status_details', 'confidentiality_level_details',
            'document_type', 'confidentiality_level', 'assigned_to_id', 'comments', 'history', 'attachments',
            'portal_submission',
        ]
        read_only_fields = ['status', 'creator', 'current_owner', 'department']

    def update(self, instance, validated_data):
        """
        Prevent arbitrary users from re-assigning documents.
        - Document creation can include `assigned_to_id`
        - Document updates can change assignment only for Admin/Department Chef/superuser
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if "assigned_to" in validated_data:
            role = getattr(getattr(user, "profile", None), "role", None) if user else None
            can_reassign = bool(user and (user.is_superuser or role == "Admin"))
            if not can_reassign:
                validated_data.pop("assigned_to", None)

        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    position = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True, default='Employee')

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'full_name', 'position', 'role']

    def create(self, validated_data):
        """
        Register a new user and align Django admin flags with the chosen role
        using the shared utility function.
        """
        from .utils import create_user_with_profile
        
        full_name = validated_data.pop('full_name', '')
        position = validated_data.pop('position', '')
        role = validated_data.pop('role', 'Employee')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')

        user = create_user_with_profile(
            username=username,
            password=password,
            email=email,
            role=role,
            full_name=full_name,
            position=position
        )

        return user
