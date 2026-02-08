import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from documents.models import Department, DocumentType, DocumentStatus, UserProfile, ConfidentialityLevel, NotificationType

def create_data():
    print("Creating initial data...")
    
    # Departments
    hr, _ = Department.objects.get_or_create(name="HR", defaults={"description": "Human Resources"})
    it, _ = Department.objects.get_or_create(name="IT", defaults={"description": "Information Technology"})
    sales, _ = Department.objects.get_or_create(name="Sales", defaults={"description": "Sales Department"})
    print("Departments created.")

    # Document Types
    DocumentType.objects.get_or_create(name="Order", defaults={"code": "ORDER"})
    DocumentType.objects.get_or_create(name="Report", defaults={"code": "REPORT"})
    DocumentType.objects.get_or_create(name="Request", defaults={"code": "REQUEST"})
    print("Document Types created.")

    # Document Statuses
    DocumentStatus.objects.get_or_create(name="Draft", defaults={"code": "DRAFT"})
    DocumentStatus.objects.get_or_create(name="Pending Approval", defaults={"code": "PENDING"})
    DocumentStatus.objects.get_or_create(name="Approved", defaults={"code": "APPROVED"})
    DocumentStatus.objects.get_or_create(name="Rejected", defaults={"code": "REJECTED"})
    print("Document Statuses created.")

    # Confidentiality Levels
    ConfidentialityLevel.objects.get_or_create(name="Public", defaults={"code": "PUBLIC"})
    ConfidentialityLevel.objects.get_or_create(name="Internal", defaults={"code": "INTERNAL"})
    ConfidentialityLevel.objects.get_or_create(name="Confidential", defaults={"code": "CONFIDENTIAL"})
    print("Confidentiality Levels created.")
    
    # Notification Types
    NotificationType.objects.get_or_create(name="New Document", defaults={"code": "NEW_DOCUMENT"})
    NotificationType.objects.get_or_create(name="Needs Approval", defaults={"code": "NEEDS_APPROVAL"})
    print("Notification Types created.")

    # Users
    # Admin
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
        if not hasattr(admin, 'profile'):
             UserProfile.objects.create(user=admin)
        admin.profile.role = 'Admin'
        admin.profile.department = it
        admin.profile.save()
        print("Admin user created.")

    # Manager
    if not User.objects.filter(username='manager').exists():
        manager = User.objects.create_user('manager', 'manager@example.com', 'managerpass')
        if not hasattr(manager, 'profile'):
             UserProfile.objects.create(user=manager)
        manager.profile.role = 'Manager'
        manager.profile.department = hr
        manager.profile.save()
        print("Manager user created.")

    # Employee
    if not User.objects.filter(username='employee').exists():
        employee = User.objects.create_user('employee', 'employee@example.com', 'employeepass')
        if not hasattr(employee, 'profile'):
             UserProfile.objects.create(user=employee)
        employee.profile.role = 'Employee'
        employee.profile.department = hr
        employee.profile.save()
        print("Employee user created.")

if __name__ == '__main__':
    create_data()
