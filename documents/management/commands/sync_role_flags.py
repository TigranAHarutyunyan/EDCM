from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from documents.models import UserProfile


class Command(BaseCommand):
    help = "Sync User.is_staff/is_superuser from UserProfile.role for all users."
    print(help)
    def handle(self, *args, **options):
        updated = 0
        checked = 0

        for profile in UserProfile.objects.select_related("user").all():
            user = profile.user
            checked += 1

            # Protect explicit superusers; don't derive superuser from business roles.
            if user.is_superuser:
                if profile.role != "Admin":
                    UserProfile.objects.filter(pk=profile.pk).update(role="Admin")
                    updated += 1
                if not user.is_staff:
                    User.objects.filter(pk=user.pk).update(is_staff=True)
                    updated += 1
                continue

            should_be_staff = profile.role == "Admin"
            should_be_superuser = False

            if user.is_staff != should_be_staff or user.is_superuser != should_be_superuser:
                User.objects.filter(pk=user.pk).update(
                    is_staff=should_be_staff,
                    is_superuser=should_be_superuser,
                )
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Checked {checked} profiles; updated {updated} users."))
