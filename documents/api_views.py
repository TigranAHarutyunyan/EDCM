from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
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
    DocumentAttachmentSerializer,
)
from .models import (
    Document,
    Department,
    DocumentType,
    DocumentStatus,
    ConfidentialityLevel,
    DocumentComment,
    AuditLog,
    UserProfile,
    DocumentAttachment,
    PortalSubmission,
)


def _user_can_access_document(user, document):
    """
    Keep document access rules consistent across endpoints.
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.is_staff:
        return True

    role = getattr(getattr(user, "profile", None), "role", None)
    if role == "Admin":
        return True

    dept_id = getattr(getattr(user, "profile", None), "department_id", None)
    if dept_id and document.department_id == dept_id:
        return True

    if document.creator_id == user.id:
        return True

    if document.assigned_to_id == user.id:
        return True

    return False


def _require_document_access(user, document):
    if not _user_can_access_document(user, document):
        raise PermissionDenied("You do not have permission to access this document.")


def _get_client_ip(request):
    # Best-effort: honor common proxy headers but fall back to REMOTE_ADDR.
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None


def _get_portal_inbox_user():
    """
    The "special user" who receives all public portal submissions.

    Configure via env var:
      PORTAL_INBOX_USERNAME=dispatcher

    Fallback: 'admin' if present, else first superuser.
    """
    username = getattr(settings, "PORTAL_INBOX_USERNAME", None) or "admin"
    user = User.objects.filter(username=username, is_active=True).first()
    if user:
        return user
    user = User.objects.filter(is_superuser=True, is_active=True).order_by("id").first()
    if user:
        return user
    raise ValidationError({"detail": "Portal inbox user is not configured."})

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
            'role': user.profile.role if hasattr(user, 'profile') else 'Employee',
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'portal_inbox_username': getattr(settings, "PORTAL_INBOX_USERNAME", "admin"),
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
                "portal_inbox_username": getattr(settings, "PORTAL_INBOX_USERNAME", "admin"),
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
                Q(department=user.profile.department) | Q(creator=user) | Q(assigned_to=user)
            ).distinct()
        else:
            queryset = Document.objects.filter(Q(creator=user) | Q(assigned_to=user)).distinct()

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
            
        raise PermissionDenied("You do not have permission to access this user.")

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
            
        raise PermissionDenied("You do not have permission to delete this document.")

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
            return Document.objects.filter(
                Q(department=dept) | Q(creator=user) | Q(assigned_to=user)
            ).distinct()

        return Document.objects.filter(Q(creator=user) | Q(assigned_to=user)).distinct()

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
            _require_document_access(user, document)
            
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


class DocumentAttachmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_document(self):
        document = generics.get_object_or_404(Document, pk=self.kwargs["pk"])
        _require_document_access(self.request.user, document)
        return document

    def get_queryset(self):
        document = self._get_document()
        return document.attachments.select_related("uploaded_by").all()

    def perform_create(self, serializer):
        document = self._get_document()
        upload = self.request.FILES.get("file")
        if not upload:
            raise ValidationError({"file": "This field is required."})

        serializer.save(
            document=document,
            uploaded_by=self.request.user,
            original_name=getattr(upload, "name", "") or "",
            content_type=getattr(upload, "content_type", "") or "",
            size=int(getattr(upload, "size", 0) or 0),
        )


class DocumentAttachmentDeleteView(generics.DestroyAPIView):
    serializer_class = DocumentAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        attachment = generics.get_object_or_404(
            DocumentAttachment.objects.select_related("document", "uploaded_by"),
            pk=self.kwargs["pk"],
            document_id=self.kwargs["document_pk"],
        )

        document = attachment.document
        actor = self.request.user
        _require_document_access(actor, document)

        role = getattr(getattr(actor, "profile", None), "role", None)
        dept_id = getattr(getattr(actor, "profile", None), "department_id", None)

        is_admin = bool(actor.is_superuser or actor.is_staff or role == "Admin")
        is_creator = document.creator_id == actor.id
        is_uploader = attachment.uploaded_by_id == actor.id
        is_dept_manager = bool(role == "Manager" and dept_id and document.department_id == dept_id)

        if not (is_admin or is_creator or is_uploader or is_dept_manager):
            raise PermissionDenied("You do not have permission to delete this attachment.")

        return attachment


class PortalSubmitView(APIView):
    """
    Public endpoint: external clients can submit a document.
    The created document is assigned to the configured portal inbox user.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        description = (request.data.get("description") or "").strip()

        client_name = (request.data.get("client_name") or "").strip()
        client_email = (request.data.get("client_email") or "").strip()
        client_phone = (request.data.get("client_phone") or "").strip()
        company = (request.data.get("company") or "").strip()

        if not title:
            raise ValidationError({"title": "This field is required."})

        inbox_user = _get_portal_inbox_user()

        # Use stable defaults.
        doc_type, _ = DocumentType.objects.get_or_create(code="REQUEST", defaults={"name": "Request"})
        pending_status, _ = DocumentStatus.objects.get_or_create(code="PENDING", defaults={"name": "Pending Approval"})
        public_level, _ = ConfidentialityLevel.objects.get_or_create(code="PUBLIC", defaults={"name": "Public"})

        document = Document.objects.create(
            title=title,
            description=description,
            document_type=doc_type,
            status=pending_status,
            confidentiality_level=public_level,
            creator=inbox_user,
            current_owner=inbox_user,
            assigned_to=inbox_user,
            department=None,
        )

        PortalSubmission.objects.create(
            document=document,
            client_name=client_name,
            client_email=client_email,
            client_phone=client_phone,
            company=company,
            ip_address=_get_client_ip(request),
            user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:255],
        )

        # Files: accept either `files` (multiple) or a single `file`.
        uploads = list(request.FILES.getlist("files"))
        if not uploads and request.FILES.get("file"):
            uploads = [request.FILES["file"]]

        for upload in uploads:
            # Enforce the same extension validation used by the authenticated attachments endpoint.
            file_field = DocumentAttachment._meta.get_field("file")
            for validator in getattr(file_field, "validators", []):
                validator(upload)

            DocumentAttachment.objects.create(
                document=document,
                file=upload,
                original_name=getattr(upload, "name", "") or "",
                content_type=getattr(upload, "content_type", "") or "",
                size=int(getattr(upload, "size", 0) or 0),
                uploaded_by=None,  # external/public submission
            )

        AuditLog.objects.create(
            user=None,
            document=document,
            action="Portal submitted",
            details=f"Client: {client_name or '-'} / {client_email or '-'}",
        )

        return Response(
            {"id": document.id, "message": "Submitted successfully"},
            status=status.HTTP_201_CREATED,
        )


class DocumentRouteToDepartmentView(APIView):
    """
    Internal action: route an incoming document to a department.

    Intended for the portal inbox user, Admin business role, or Django superuser.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        actor = request.user
        role = getattr(getattr(actor, "profile", None), "role", None)
        is_allowed = bool(
            actor.is_superuser
            or role == "Admin"
            or actor.username == (getattr(settings, "PORTAL_INBOX_USERNAME", None) or "admin")
        )
        if not is_allowed:
            raise PermissionDenied("You do not have permission to route documents.")

        document = generics.get_object_or_404(Document, pk=pk)

        department_id = request.data.get("department_id", None)
        if not department_id:
            raise ValidationError({"department_id": "This field is required."})

        department = generics.get_object_or_404(Department, pk=department_id)

        assigned_to_id = request.data.get("assigned_to_id", None)
        assigned_to = None
        if assigned_to_id not in (None, "", "null"):
            assigned_to = generics.get_object_or_404(User, pk=assigned_to_id)

        document.department = department
        if assigned_to is not None:
            document.assigned_to = assigned_to
        document.save()

        AuditLog.objects.create(
            user=actor,
            document=document,
            action="Routed",
            details=f"Routed to {department.name}",
        )

        return Response(DocumentSerializer(document).data)

class PortalInboxListView(generics.ListAPIView):
    """
    Lists documents that were submitted via portal and haven't been routed yet.
    """
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # We define "unrouted" as portal-origin documents with no department assigned
        return Document.objects.filter(
            portal_submission__isnull=False,
            department__isnull=True
        ).order_by('-created_at')

class PortalStatusSyncView(APIView):
    """
    Dedicated endpoint for the external Client Portal to sync document status.
    For this architectural demonstration, it allows looking up by client email.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get("email")
        if not email:
            return Response({"error": "email is required"}, status=400)
            
        submissions = PortalSubmission.objects.filter(client_email=email).select_related('document__status')
        results = []
        for sub in submissions:
            results.append({
                "id": sub.document_id,
                "title": sub.document.title,
                "status_name": sub.document.status.name,
                "status_code": sub.document.status.code,
                "updated_at": sub.document.updated_at
            })
        return Response(results)

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
            raise PermissionDenied("You do not have permission to delete this user.")

        obj_role = getattr(getattr(obj, "profile", None), "role", None)
        if obj_role != "Employee":
            raise PermissionDenied("You can only delete employees.")

        if not hasattr(obj, "profile") or obj.profile.department_id != dept.id:
            raise PermissionDenied("User is not in your department.")

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
            raise PermissionDenied("Document is not in your department.")

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
