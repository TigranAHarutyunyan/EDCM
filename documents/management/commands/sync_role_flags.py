from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from documents.models import UserProfile


class Command(BaseCommand):
    help = "Sync User.is_staff/is_superuser from UserProfile.role for all users."

    def handle(self, *args, **options):
        updated = 0
        checked = 0

        for profile in UserProfile.objects.select_related("user").all():
            user = profile.user
            checked += 1

            should_be_staff = profile.role in ("Admin", "Department Chef")
            should_be_superuser = profile.role == "Admin"

            if user.is_staff != should_be_staff or user.is_superuser != should_be_superuser:
                User.objects.filter(pk=user.pk).update(
                    is_staff=should_be_staff,
                    is_superuser=should_be_superuser,
                )
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Checked {checked} profiles; updated {updated} users."))
