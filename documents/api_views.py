from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
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
from .models import Document, Department, DocumentType, DocumentStatus, ConfidentialityLevel, DocumentComment, AuditLog, UserProfile

class IsAdminOrDepartmentChef(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        is_admin = request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'Admin')
        is_chef = hasattr(request.user, 'profile') and request.user.profile.role == 'Department Chef'
        
        return is_admin or is_chef


class IsDepartmentManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "Manager"
            and request.user.profile.department_id
        )

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
    authentication_classes = []
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        resp = Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'role': user.profile.role if hasattr(user, 'profile') else 'Employee'
        })

        # Store token in an HttpOnly cookie (avoid localStorage).
        resp.set_cookie(
            "edcm_auth",
            token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/",
        )
        return resp


class LogoutView(APIView):
    """
    Clears all authentication and session cookies.
    By using empty authentication_classes, we ensuring that a user can ALWAYS log out
    even if their CSRF token or session has expired (preventing a 'lockout' loop).
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        resp = Response({"ok": True})
        # Remove all possible auth and session cookies
        resp.delete_cookie("edcm_auth", path="/")
        resp.delete_cookie("csrftoken", path="/")
        resp.delete_cookie("sessionid", path="/")
        return resp


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Sets the csrftoken cookie via the decorator.
        return Response({"ok": True})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.profile.role if hasattr(user, "profile") else "Employee",
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        )

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
        return [IsAdminOrDepartmentChef()]

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrDepartmentChef]

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

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Document.objects.all()

        role = getattr(getattr(user, "profile", None), "role", None)
        dept = getattr(getattr(user, "profile", None), "department", None)

        if role == "Admin":
            return Document.objects.all()

        if dept:
            return Document.objects.filter(Q(department=dept) | Q(creator=user)).distinct()

        return Document.objects.filter(creator=user)

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

            # Ensure the user can access this document (same rules as list/detail).
            role = getattr(getattr(user, "profile", None), "role", None)
            dept = getattr(getattr(user, "profile", None), "department", None)
            if not (
                user.is_superuser
                or role == "Admin"
                or (dept and document.department_id == dept.id)
                or document.creator_id == user.id
            ):
                raise permissions.PermissionDenied("You do not have permission to access this document.")
            
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


class DepartmentDocumentsView(generics.ListAPIView):
    """
    Head of Department (Manager) can see all documents in their own department.
    """

    serializer_class = DocumentSerializer
    permission_classes = [IsDepartmentManager]

    def get_queryset(self):
        dept = self.request.user.profile.department
        return Document.objects.filter(department=dept).order_by("-created_at")


class DepartmentEmployeesView(generics.ListCreateAPIView):
    """
    Head of Department (Manager) can list all users in their own department and create Employees.
    """

    serializer_class = UserSerializer
    permission_classes = [IsDepartmentManager]

    def get_queryset(self):
        dept = self.request.user.profile.department
        return User.objects.filter(profile__department=dept).order_by("username")

    def perform_create(self, serializer):
        dept = self.request.user.profile.department
        # Force role/department to avoid privilege escalation.
        if not self.request.data.get("password"):
            raise ValidationError({"password": "This field is required."})
        serializer.save(role="Employee", department_id=dept)


class DepartmentEmployeeDeleteView(generics.DestroyAPIView):
    """
    Head of Department (Manager) can delete an Employee in their department.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsDepartmentManager]

    def get_object(self):
        obj = super().get_object()
        actor = self.request.user
        dept = actor.profile.department

        if obj.is_superuser or obj == actor:
            raise permissions.PermissionDenied("You do not have permission to delete this user.")

        obj_role = getattr(getattr(obj, "profile", None), "role", None)
        if obj_role != "Employee":
            raise permissions.PermissionDenied("You can only delete employees.")

        if not hasattr(obj, "profile") or obj.profile.department_id != dept.id:
            raise permissions.PermissionDenied("User is not in your department.")

        return obj


class DepartmentDocumentOwnerUpdateView(APIView):
    """
    Head of Department (Manager) can change document owner/assignee within their department.
    """

    permission_classes = [IsDepartmentManager]

    def patch(self, request, pk):
        actor = request.user
        dept = actor.profile.department
        document = Document.objects.get(pk=pk)

        if document.department_id != dept.id:
            raise permissions.PermissionDenied("Document is not in your department.")

        current_owner_id = request.data.get("current_owner_id", None)
        assigned_to_id = request.data.get("assigned_to_id", None)

        changed_fields = []

        if current_owner_id is not None:
            new_owner = None
            if current_owner_id != "" and current_owner_id is not None:
                new_owner = User.objects.get(pk=current_owner_id)
                if not hasattr(new_owner, "profile") or new_owner.profile.department_id != dept.id:
                    return Response({"error": "Owner must be in your department."}, status=status.HTTP_400_BAD_REQUEST)
            document.current_owner = new_owner
            changed_fields.append("current_owner")

        if "assigned_to_id" in request.data:
            new_assignee = None
            if assigned_to_id not in (None, "", "null"):
                new_assignee = User.objects.get(pk=assigned_to_id)
                if not hasattr(new_assignee, "profile") or new_assignee.profile.department_id != dept.id:
                    return Response({"error": "Assignee must be in your department."}, status=status.HTTP_400_BAD_REQUEST)
            document.assigned_to = new_assignee
            changed_fields.append("assigned_to")

        if not changed_fields:
            return Response({"error": "No changes requested."}, status=status.HTTP_400_BAD_REQUEST)

        document.save()
        AuditLog.objects.create(
            user=actor,
            document=document,
            action="Department update",
            details=f"Updated {', '.join(changed_fields)}",
        )
        return Response(DocumentSerializer(document).data)
