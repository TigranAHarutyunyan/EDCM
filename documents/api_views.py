from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    DocumentSerializer,
    DepartmentSerializer,
    DocumentTypeSerializer,
    DocumentStatusSerializer,
    ConfidentialityLevelSerializer,
    DocumentCommentSerializer,
)
from .models import Document, Department, DocumentType, DocumentStatus, ConfidentialityLevel, DocumentComment, AuditLog

class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'message': 'EDCM API is running'
        }, status=status.HTTP_200_OK)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

@method_decorator(csrf_exempt, name='dispatch')
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'role': user.profile.role if hasattr(user, 'profile') else 'Employee'
        })

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'pending_count': 0,
            'my_docs_count': Document.objects.filter(Q(creator=user) | Q(assigned_to=user)).distinct().count(),
            'recent_docs': []
        }
        
        # Pending documents logic
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            pending_status = DocumentStatus.objects.filter(code='PENDING').first()
            if pending_status:
                data['pending_count'] = Document.objects.filter(
                    department=user.profile.department,
                    status=pending_status
                ).count()
        
        # Recent documents
        recent = Document.objects.filter(creator=user).order_by('-created_at')[:5]
        data['recent_docs'] = DocumentSerializer(recent, many=True).data
        
        return Response(data)

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Document.objects.none()

        # Base Queryset based on permissions
        if user.is_staff:
            queryset = Document.objects.all()
        elif hasattr(user, 'profile') and user.profile.department:
            queryset = Document.objects.filter(
                Q(department=user.profile.department) | Q(creator=user)
            ).distinct()
        else:
            queryset = Document.objects.filter(creator=user)

        # Filtering by ownership
        owner = self.request.query_params.get('owner')
        if owner == 'me':
            queryset = Document.objects.filter(Q(creator=user) | Q(assigned_to=user)).distinct()
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Set default values for creator, profile, etc.
        user = self.request.user
        department = user.profile.department if hasattr(user, 'profile') else None
        
        # Ensure we always have a Draft status; create it on the fly if missing.
        status_draft, _ = DocumentStatus.objects.get_or_create(
            code='DRAFT',
            defaults={'name': 'Draft'},
        )
        
        serializer.save(
            creator=user,
            current_owner=user,
            department=department,
            status=status_draft
        )

class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAdminUser]

class DocumentTypeListView(generics.ListAPIView):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class ConfidentialityLevelListView(generics.ListAPIView):
    queryset = ConfidentialityLevel.objects.all()
    serializer_class = ConfidentialityLevelSerializer
    permission_classes = [permissions.IsAuthenticated]

# Admin User Management Views
class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admins see everyone
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'Admin'):
            return User.objects.all()
        # Managers see only their department
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            return User.objects.filter(profile__department=user.profile.department)
        # Others see only themselves
        return User.objects.filter(id=user.id)

    def get_permissions(self):
        user = self.request.user
        # Only admins and managers can access this endpoint
        is_admin = user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'Admin')
        is_manager = hasattr(user, 'profile') and user.profile.role == 'Manager'
        
        if is_admin or is_manager:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        user = self.request.user
        # If manager, force the department to be their own
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            serializer.save(department_id=user.profile.department)
        else:
            serializer.save()

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        is_admin = user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'Admin')
        if is_admin:
            return obj
            
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            if hasattr(obj, 'profile') and obj.profile.department == user.profile.department:
                return obj
        
        if obj == user:
            return obj
            
        raise permissions.PermissionDenied("You do not have permission to access this user.")

    def delete(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        if user_to_delete.is_superuser:
            return Response(
                {"error": "Cannot delete superuser"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if user_to_delete == request.user:
            return Response(
                {"error": "Cannot delete yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().delete(request, *args, **kwargs)

class DocumentDeleteView(generics.DestroyAPIView):
    queryset = Document.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        is_admin = user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'Admin')
        if is_admin:
            return obj
            
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            if obj.department == user.profile.department:
                return obj
                
        if obj.creator == user:
            return obj
            
        raise permissions.PermissionDenied("You do not have permission to delete this document.")

class DocumentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        # Log the action
        AuditLog.objects.create(
            user=self.request.user,
            document=instance,
            action="Updated fields",
            details=f"Updated by {self.request.user.username}"
        )

class DocumentTakeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
            user = request.user
            
            # Check if already taken
            if document.assigned_to and document.assigned_to != user:
                return Response({"error": f"Document already taken by {document.assigned_to.username}"}, status=status.HTTP_400_BAD_REQUEST)
            
            document.assigned_to = user
            document.save()
            
            AuditLog.objects.create(
                user=user,
                document=document,
                action="Taken",
                details=f"Document taken by {user.username}"
            )
            
            return Response(DocumentSerializer(document).data)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

class DocumentCommentCreateView(generics.CreateAPIView):
    serializer_class = DocumentCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        document_id = self.kwargs.get('pk')
        document = Document.objects.get(pk=document_id)
        serializer.save(user=self.request.user, document=document)
        
        AuditLog.objects.create(
            user=self.request.user,
            document=document,
            action="Commented",
            details=f"New comment added"
        )


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_serializer = UserSerializer(user)
        
        # Documents created by user
        created_docs = Document.objects.filter(creator=user).order_by('-created_at')
        # Documents assigned/taken by user
        assigned_docs = Document.objects.filter(assigned_to=user).order_by('-created_at')
        
        return Response({
            'user': profile_serializer.data,
            'created_documents': DocumentSerializer(created_docs, many=True).data,
            'assigned_documents': DocumentSerializer(assigned_docs, many=True).data,
        })

    def patch(self, request):
        user = request.user
        profile = user.profile
        
        # We can update profile fields and User fields
        full_name = request.data.get('full_name')
        if full_name is not None:
            profile.full_name = full_name
            
        position = request.data.get('position')
        if position is not None:
            profile.position = position
            
        bio = request.data.get('bio')
        if bio is not None:
            profile.bio = bio
            
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
            
        profile.save()
        return Response(UserSerializer(user).data)

class AdminUserCreateView(generics.CreateAPIView):
    """
    Admin-only endpoint to create a new user (with any role, including Admin).
    This is primarily used by the admin panel to manage users.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Only allow calls from users with full admin privileges.
        """
        user = self.request.user
        is_admin_role = hasattr(user, 'profile') and user.profile.role == 'Admin'
        if user.is_superuser or is_admin_role:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
