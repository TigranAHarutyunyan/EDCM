<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
from django.shortcuts import render
from django.http import HttpResponseNotFound


def _app_user_from_auth_cookie(request):
    """
    Resolve the SPA-authenticated user (DRF token in HttpOnly cookie) without
    relying on Django sessions.
    """
    token_key = request.COOKIES.get("edcm_auth")
    if not token_key:
        return None
    try:
        from rest_framework.authtoken.models import Token

        token = Token.objects.select_related("user", "user__profile").get(key=token_key)
        return token.user
    except Exception:
        return None
=======
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Document, DocumentStatus, AuditLog
from .forms import DocumentForm
from django.http import HttpResponse
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)

# React App View
def react_app(request):
    """Serve the React application"""
    return render(request, 'index.html')

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD

def department_entry(request):
    """
    Entry point for the Department Panel SPA route.
    Only Heads of Department (Managers) can access `/department/`.
    """
    user = request.user if request.user.is_authenticated else _app_user_from_auth_cookie(request)
    role = getattr(getattr(user, "profile", None), "role", None) if user else None
    dept_id = getattr(getattr(user, "profile", None), "department_id", None) if user else None

    if user and user.is_active and role == "Manager" and dept_id:
        return render(request, "index.html")

    return HttpResponseNotFound()
=======
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
class DashboardView(LoginRequiredMixin, ListView):
    model = Document
    template_name = 'dashboard.html'
    context_object_name = 'documents'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Pending documents for managers
        if hasattr(user, 'profile') and user.profile.role == 'Manager':
            pending_status = DocumentStatus.objects.filter(code='PENDING').first()
            if pending_status:
                context['pending_documents'] = Document.objects.filter(
                    department=user.profile.department,
                    status=pending_status
                )
        
        # Recent documents
        context['recent_documents'] = Document.objects.filter(creator=user).order_by('-updated_at')[:5]
        return context

class DocumentListView(LoginRequiredMixin, ListView):
    model = Document
    template_name = 'document_list.html'
    context_object_name = 'documents'

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.department:
            return Document.objects.filter(department=user.profile.department).order_by('-updated_at')
        return Document.objects.filter(creator=user).order_by('-updated_at')

class DocumentDetailView(LoginRequiredMixin, DetailView):
    model = Document
    template_name = 'document_detail.html'
    context_object_name = 'document'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['history'] = AuditLog.objects.filter(document=self.object).order_by('-timestamp')
        return context

class DocumentCreateView(LoginRequiredMixin, CreateView):
    model = Document
    form_class = DocumentForm
    template_name = 'document_form.html'
    success_url = reverse_lazy('document_list')

    def form_valid(self, form):
        form.instance.creator = self.request.user
        form.instance.current_owner = self.request.user
        if hasattr(self.request.user, 'profile'):
            form.instance.department = self.request.user.profile.department
        
        # Set default status to Draft
        draft_status = DocumentStatus.objects.filter(code='DRAFT').first()
        if draft_status:
            form.instance.status = draft_status
        
        return super().form_valid(form)

@login_required
def send_for_approval(request, pk):
    document = get_object_or_404(Document, pk=pk)
    pending_status = DocumentStatus.objects.filter(code='PENDING').first()
    if pending_status:
        document.status = pending_status
        document.save()
        AuditLog.objects.create(
            user=request.user,
            document=document,
            action='Sent for Approval'
        )
    return redirect('document_detail', pk=pk)

@login_required
def approve_document(request, pk):
    document = get_object_or_404(Document, pk=pk)
    approved_status = DocumentStatus.objects.filter(code='APPROVED').first()
    if approved_status:
        document.status = approved_status
        document.save()
        AuditLog.objects.create(
            user=request.user,
            document=document,
            action='Approved'
        )
    return redirect('document_detail', pk=pk)

@login_required
def reject_document(request, pk):
    document = get_object_or_404(Document, pk=pk)
    rejected_status = DocumentStatus.objects.filter(code='REJECTED').first()
    if rejected_status:
        document.status = rejected_status
        document.current_owner = document.creator
        document.save()
        AuditLog.objects.create(
            user=request.user,
            document=document,
            action='Rejected'
        )
    return redirect('document_detail', pk=pk)
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)
