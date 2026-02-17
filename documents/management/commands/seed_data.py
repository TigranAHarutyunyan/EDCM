from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from documents.models import (
    Department,
    DocumentType,
    DocumentStatus,
    UserProfile,
    ConfidentialityLevel,
    NotificationType,
    Document,
)

class Command(BaseCommand):
    help = 'Seeds the database with initial departments, types, and users'

    def handle(self, *args, **options):
        self.stdout.write("🌱 Starting database seeding...")
        
        try:
            # Departments
            hr, _ = Department.objects.get_or_create(name="HR", defaults={"description": "Human Resources"})
            it, _ = Department.objects.get_or_create(name="IT", defaults={"description": "Information Technology"})
            sales, _ = Department.objects.get_or_create(name="Sales", defaults={"description": "Sales Department"})
            self.stdout.write(self.style.SUCCESS("✅ Departments created."))

            # Document Types
            DocumentType.objects.get_or_create(name="Order", defaults={"code": "ORDER"})
            DocumentType.objects.get_or_create(name="Report", defaults={"code": "REPORT"})
            DocumentType.objects.get_or_create(name="Request", defaults={"code": "REQUEST"})
            self.stdout.write(self.style.SUCCESS("✅ Document Types created."))

            # Document Statuses
            DocumentStatus.objects.get_or_create(name="Draft", defaults={"code": "DRAFT"})
            DocumentStatus.objects.get_or_create(name="Pending Approval", defaults={"code": "PENDING"})
            DocumentStatus.objects.get_or_create(name="Approved", defaults={"code": "APPROVED"})
            DocumentStatus.objects.get_or_create(name="Rejected", defaults={"code": "REJECTED"})
            self.stdout.write(self.style.SUCCESS("✅ Document Statuses created."))

            # Confidentiality Levels
            ConfidentialityLevel.objects.get_or_create(name="Public", defaults={"code": "PUBLIC"})
            ConfidentialityLevel.objects.get_or_create(name="Internal", defaults={"code": "INTERNAL"})
            ConfidentialityLevel.objects.get_or_create(name="Confidential", defaults={"code": "CONFIDENTIAL"})
            self.stdout.write(self.style.SUCCESS("✅ Confidentiality Levels created."))
            
            # Notification Types
            NotificationType.objects.get_or_create(name="New Document", defaults={"code": "NEW_DOCUMENT"})
            NotificationType.objects.get_or_create(name="Needs Approval", defaults={"code": "NEEDS_APPROVAL"})
            self.stdout.write(self.style.SUCCESS("✅ Notification Types created."))

            # Users
            # Admin
            if not User.objects.filter(username='admin').exists():
                admin = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
                if not hasattr(admin, 'profile'):
                    UserProfile.objects.create(user=admin)
                admin.profile.full_name = "System Administrator"
                admin.profile.position = "Head of IT"
                admin.profile.role = 'Admin'
                admin.profile.department = it
                admin.profile.save()
                self.stdout.write(self.style.SUCCESS("✅ Admin user created."))
            
            # Manager
            if not User.objects.filter(username='manager').exists():
                manager = User.objects.create_user('manager', 'manager@example.com', 'managerpass')
                if not hasattr(manager, 'profile'):
                    UserProfile.objects.create(user=manager)
                manager.profile.full_name = "HR Manager"
                manager.profile.position = "HR Manager"
                manager.profile.role = 'Manager'
                manager.profile.department = hr
                manager.profile.save()
                self.stdout.write(self.style.SUCCESS("✅ Manager user created."))
            
            # Employee
            if not User.objects.filter(username='employee').exists():
                employee = User.objects.create_user('employee', 'employee@example.com', 'employeepass')
                if not hasattr(employee, 'profile'):
                    UserProfile.objects.create(user=employee)
                employee.profile.full_name = "John Employee"
                employee.profile.position = "HR Specialist"
                employee.profile.role = 'Employee'
                employee.profile.department = hr
                employee.profile.save()
                self.stdout.write(self.style.SUCCESS("✅ Employee user created."))

            # Department Chef
            if not User.objects.filter(username='chef').exists():
                chef = User.objects.create_user('chef', 'chef@example.com', 'chefpass')
                if not hasattr(chef, 'profile'):
                    UserProfile.objects.create(user=chef)
                chef.profile.full_name = "Department Chef"
                chef.profile.position = "Dept Head"
                chef.profile.role = 'Department Chef'
                chef.profile.department = sales
                chef.profile.save()
                self.stdout.write(self.style.SUCCESS("✅ Department Chef user created."))

            # Sample documents
            order_type = DocumentType.objects.filter(code="ORDER").first()
            report_type = DocumentType.objects.filter(code="REPORT").first()
            draft_status = DocumentStatus.objects.filter(code="DRAFT").first()
            pending_status = DocumentStatus.objects.filter(code="PENDING").first()
            public_level = ConfidentialityLevel.objects.filter(code="PUBLIC").first()
            internal_level = ConfidentialityLevel.objects.filter(code="INTERNAL").first()

            employee_user = User.objects.filter(username="employee").first()
            manager_user = User.objects.filter(username="manager").first()

            if employee_user and order_type and draft_status and public_level:
                Document.objects.get_or_create(
                    title="Sample Order Draft",
                    creator=employee_user,
                    defaults={
                        "description": "Initial draft of an order document.",
                        "document_type": order_type,
                        "status": draft_status,
                        "confidentiality_level": public_level,
                        "current_owner": employee_user,
                        "department": employee_user.profile.department,
                    },
                )

            if manager_user and report_type and pending_status and internal_level:
                Document.objects.get_or_create(
                    title="Quarterly Report Pending Approval",
                    creator=manager_user,
                    defaults={
                        "description": "Quarterly performance report awaiting approval.",
                        "document_type": report_type,
                        "status": pending_status,
                        "confidentiality_level": internal_level,
                        "current_owner": manager_user,
                        "department": manager_user.profile.department,
                    },
                )
            self.stdout.write(self.style.SUCCESS("✅ Database seeding completed!"))
            
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error during seeding: {str(e)}"))
            # Don't re-raise, we want the app to start even if seeding fails
