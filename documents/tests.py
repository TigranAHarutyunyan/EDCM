from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from .models import Department, DocumentType, DocumentStatus, ConfidentialityLevel, Document, UserProfile, Notification, NotificationType


class DocumentStatusAndRoutingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='password', is_staff=True)
        profile = UserProfile.objects.get(user=self.admin)
        profile.role = 'Admin'
        profile.save()

        self.manager_user = User.objects.create_user(username='manager', password='password')
        manager_profile = UserProfile.objects.get(user=self.manager_user)
        manager_profile.role = 'Manager'
        self.dept = Department.objects.create(name='Finance')
        manager_profile.department = self.dept
        manager_profile.save()

        self.employee_user = User.objects.create_user(username='employee', password='password')
        employee_profile = UserProfile.objects.get(user=self.employee_user)
        employee_profile.role = 'Employee'
        employee_profile.department = self.dept
        employee_profile.save()

        self.doc_type = DocumentType.objects.create(name='Report', code='REPORT')
        self.status_draft = DocumentStatus.objects.create(name='Draft', code='DRAFT')
        self.status_pending = DocumentStatus.objects.create(name='Pending', code='PENDING')
        self.conf = ConfidentialityLevel.objects.create(name='Public', code='PUBLIC')

        self.document = Document.objects.create(
            title='Q1 Report',
            description='Quarterly report file',
            document_type=self.doc_type,
            status=self.status_draft,
            confidentiality_level=self.conf,
            creator=self.employee_user,
            current_owner=self.employee_user,
            department=self.dept,
        )

    def test_employee_can_change_status(self):
        self.client.force_authenticate(user=self.employee_user)

        response = self.client.patch(f'/api/documents/{self.document.id}/', {
            'status': self.status_pending.id
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.document.refresh_from_db()
        self.assertEqual(self.document.status.code, 'PENDING')

    def test_manager_can_route_document_to_own_department(self):
        self.client.force_authenticate(user=self.manager_user)

        new_dept = Department.objects.create(name='HR')
        response = self.client.patch(f'/api/documents/{self.document.id}/route/', {
            'department_id': self.dept.id
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.document.refresh_from_db()
        self.assertEqual(self.document.department, self.dept)

    def test_notifications_created_for_take_and_route(self):
        self.client.force_authenticate(user=self.employee_user)
        take_resp = self.client.post(f'/api/documents/{self.document.id}/take/')
        self.assertEqual(take_resp.status_code, 200)
        self.assertTrue(Notification.objects.filter(user=self.employee_user, notification_type__code='DOCUMENT_ASSIGNED').exists())

        self.client.force_authenticate(user=self.admin)
        route_resp = self.client.patch(f'/api/documents/{self.document.id}/route/', {
            'department_id': self.dept.id
        }, format='json')
        self.assertEqual(route_resp.status_code, 200)
        self.assertTrue(Notification.objects.filter(user=self.employee_user, notification_type__code='DOCUMENT_ROUTED').exists())


class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='notify', password='password')
        UserProfile.objects.filter(user=self.user).update(role='Employee')
        self.notification = Notification.objects.create(
            user=self.user,
            notification_type=NotificationType.objects.create(name='Test', code='TEST'),
            payload='Test payload',
            is_read=False,
        )

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/notifications/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_mark_notification_read(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(f'/api/notifications/{self.notification.id}/read/')
        self.assertEqual(resp.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)
