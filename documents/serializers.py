from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Document, Department, UserProfile, DocumentType, DocumentStatus, ConfidentialityLevel

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description']

class UserProfileSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['role', 'full_name', 'department']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True, required=False, default='Employee')
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=True, required=False, allow_null=True
    )
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'password', 'full_name', 'role', 'department_id']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', '')
        role = validated_data.pop('role', 'Employee')
        department = validated_data.pop('department_id', None)
        
        # Set administrative flags based on role
        if role == 'Admin':
            validated_data['is_staff'] = True
            validated_data['is_superuser'] = True
            
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # Update profile
        profile = user.profile
        profile.full_name = full_name
        profile.role = role
        profile.department = department
        profile.save()
        
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

class DocumentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    current_owner = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    document_type_details = DocumentTypeSerializer(source='document_type', read_only=True)
    status_details = DocumentStatusSerializer(source='status', read_only=True)
    confidentiality_level_details = ConfidentialityLevelSerializer(source='confidentiality_level', read_only=True)

    # Write-only fields for creation
    document_type_id = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all(), source='document_type', write_only=True
    )
    confidentiality_level_id = serializers.PrimaryKeyRelatedField(
        queryset=ConfidentialityLevel.objects.all(), source='confidentiality_level', write_only=True, required=False
    )

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'created_at', 'updated_at', 'due_date',
            'external_reference', 'creator', 'current_owner', 'department',
            'document_type_details', 'status_details', 'confidentiality_level_details',
            'document_type_id', 'confidentiality_level_id'
        ]
        read_only_fields = ['status', 'creator', 'current_owner', 'department']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True, default='Employee')

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'full_name', 'role']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        role = validated_data.pop('role', 'Employee')
        password = validated_data.pop('password')
        
        # Set administrative flags based on role
        if role == 'Admin':
            validated_data['is_staff'] = True
            validated_data['is_superuser'] = True
            
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Profile is created by signal, update it
        profile = user.profile
        profile.full_name = full_name
        profile.role = role
        # Default department could be assigned here if needed
        profile.save()
        
        return user
