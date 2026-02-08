from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Document, Department, DocumentType, DocumentStatus, ConfidentialityLevel
from .serializers import (
    UserSerializer, RegisterSerializer, DocumentSerializer, 
    DepartmentSerializer, DocumentTypeSerializer, DocumentStatusSerializer, 
    ConfidentialityLevelSerializer
)

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
            'my_docs_count': Document.objects.filter(creator=user).count(),
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
        recent = Document.objects.filter(creator=user).order_by('-updated_at')[:5]
        data['recent_docs'] = DocumentSerializer(recent, many=True).data
        
        return Response(data)

class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.department:
            return Document.objects.filter(
                Q(department=user.profile.department) | Q(creator=user)
            ).distinct().order_by('-updated_at')
        return Document.objects.filter(creator=user).order_by('-updated_at')

    def perform_create(self, serializer):
        # Set default values for creator, profile, etc.
        user = self.request.user
        department = user.profile.department if hasattr(user, 'profile') else None
        
        status_draft = DocumentStatus.objects.filter(code='DRAFT').first()
        
        serializer.save(
            creator=user,
            current_owner=user,
            department=department,
            status=status_draft
        )

class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny] # Allow for registration form

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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Only admins can access this endpoint
        if self.request.user.is_staff:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        # Create user with profile
        user = serializer.save()
        # Profile should be created automatically via signal
        return user

class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        if user.is_superuser:
            return Response(
                {"error": "Cannot delete superuser"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().delete(request, *args, **kwargs)
