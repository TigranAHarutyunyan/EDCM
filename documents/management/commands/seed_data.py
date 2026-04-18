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
    print(help)
    def handle(self, *args, **options):
        self.stdout.write("🌱 Starting database seeding...")
        
        try:
            # 1. Departments
            dept_names = ["HR", "IT", "Finance", "Legal", "Marketing", "Sales", "Operations", "Troubleshooting"]
            depts = {}
            for name in dept_names:
                d, _ = Department.objects.get_or_create(name=name, defaults={"description": f"{name} Department"})
                depts[name] = d
            self.stdout.write(self.style.SUCCESS(f"✅ Created {len(dept_names)} departments."))

            # 2. Document Metadata
            DocumentType.objects.get_or_create(code="ORDER", defaults={"name": "Order"})
            DocumentType.objects.get_or_create(code="REPORT", defaults={"name": "Report"})
            DocumentType.objects.get_or_create(code="REQUEST", defaults={"name": "Request"})
            
            DocumentStatus.objects.get_or_create(code="DRAFT", defaults={"name": "Draft"})
            DocumentStatus.objects.get_or_create(code="PENDING", defaults={"name": "Pending Approval"})
            DocumentStatus.objects.get_or_create(code="APPROVED", defaults={"name": "Approved"})
            DocumentStatus.objects.get_or_create(code="REJECTED", defaults={"name": "Rejected"})
            
            ConfidentialityLevel.objects.get_or_create(code="PUBLIC", defaults={"name": "Public"})
            ConfidentialityLevel.objects.get_or_create(code="INTERNAL", defaults={"name": "Internal"})
            ConfidentialityLevel.objects.get_or_create(code="CONFIDENTIAL", defaults={"name": "Confidential"})
            
            NotificationType.objects.get_or_create(code="NEW_DOCUMENT", defaults={"name": "New Document"})
            NotificationType.objects.get_or_create(code="NEEDS_APPROVAL", defaults={"name": "Needs Approval"})
            NotificationType.objects.get_or_create(code="DOCUMENT_ROUTED", defaults={"name": "Document Routed"})
            NotificationType.objects.get_or_create(code="DOCUMENT_ASSIGNED", defaults={"name": "Document Assigned"})
            NotificationType.objects.get_or_create(code="DOCUMENT_COMMENTED", defaults={"name": "Document Commented"})
            self.stdout.write(self.style.SUCCESS("✅ Metadata (Types, Statuses, Levels) ensured."))

            # 3. Users
            from documents.utils import create_user_with_profile

            # Standard Admin
            if not User.objects.filter(username='admin').exists():
                admin = create_user_with_profile(
                    username='admin', password='adminpass', email='admin@example.com',
                    role='Admin', full_name="System Administrator", position="Head of IT",
                    department=depts["IT"]
                )
                self.stdout.write(self.style.SUCCESS("✅ Admin user created."))

            # Portal Manager (Moved to Troubleshooting)
            if not User.objects.filter(username='portal_manager').exists():
                pm = create_user_with_profile(
                    username='portal_manager', password='PortalPass123!', email='pm@example.com',
                    role='Admin', full_name="Portal Inbox Manager", position="Support Lead",
                    department=depts["Troubleshooting"]
                )
                # Ensure they have staff access for cross-dept visibility
                pm.is_staff = True
                pm.save()
                self.stdout.write(self.style.SUCCESS("✅ Portal Manager created in Troubleshooting department."))

            # Create 1 Employee for each department
            for name, d in depts.items():
                username = f"user_{name.lower()}"
                if not User.objects.filter(username=username).exists():
                    create_user_with_profile(
                        username=username, password='password123', email=f"{username}@example.com",
                        role='Employee', full_name=f"{name} Specialist", position=f"{name} Associate",
                        department=d
                    )
                    self.stdout.write(self.style.SUCCESS(f"✅ Employee created for {name} ({username})."))

            self.stdout.write(self.style.SUCCESS("✅ Database seeding completed successfully!"))
            
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error during seeding: {str(e)}"))
            # Don't re-raise, we want the app to start even if seeding fails
