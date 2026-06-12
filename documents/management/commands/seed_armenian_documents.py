from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from documents.models import (
    ConfidentialityLevel,
    Department,
    Document,
    DocumentStatus,
    DocumentType,
)


ARMENIAN_DOCUMENTS = [
    (
        "Հրաման աշխատակիցների աշխատանքային գրաֆիկի մասին",
        "Սահմանվում է բաժինների աշխատանքային գրաֆիկը և հերթապահությունների բաշխումը հաջորդ ամսվա համար։",
        "HR",
        "ORDER",
    ),
    (
        "Ֆինանսական հաշվետվություն առաջին եռամսյակի համար",
        "Ներկայացվում են եկամուտների, ծախսերի և կանխատեսվող բյուջեի հիմնական ցուցանիշները։",
        "Finance",
        "REPORT",
    ),
    (
        "ՏՏ սարքավորումների ձեռքբերման հայտ",
        "Խնդրվում է հաստատել նոր համակարգիչների և աշխատանքային սարքավորումների ձեռքբերման հայտը։",
        "IT",
        "REQUEST",
    ),
    (
        "Իրավաբանական եզրակացություն պայմանագրի նախագծի վերաբերյալ",
        "Վերլուծվել են պայմանագրի հիմնական դրույթները և ներկայացվել են անհրաժեշտ փոփոխությունների առաջարկներ։",
        "Legal",
        "REPORT",
    ),
    (
        "Մարքեթինգային արշավի մեկնարկի ծրագիր",
        "Նկարագրվում են արշավի նպատակները, հաղորդակցության ուղիները և պատասխանատու անձինք։",
        "Marketing",
        "REQUEST",
    ),
    (
        "Վաճառքների ամսական ամփոփագիր",
        "Ամփոփվում են ամսվա վաճառքների արդյունքները, հաճախորդների ակտիվությունը և հաջորդ քայլերը։",
        "Sales",
        "REPORT",
    ),
    (
        "Գործառնական ընթացակարգերի թարմացման առաջարկ",
        "Առաջարկվում է վերանայել ներքին գործընթացները՝ փաստաթղթաշրջանառությունն արագացնելու համար։",
        "Operations",
        "REQUEST",
    ),
    (
        "Հաճախորդի դիմումի վերանայման արձանագրություն",
        "Արձանագրվում են հաճախորդի դիմումի ստուգման արդյունքները և պատասխան գործողությունները։",
        "Troubleshooting",
        "REPORT",
    ),
    (
        "Ներքին անվտանգության կանոնների հաստատման հրաման",
        "Հաստատվում են տեղեկատվական անվտանգության և տվյալների հասանելիության նոր կանոնները։",
        "IT",
        "ORDER",
    ),
    (
        "Բաժինների միջև համագործակցության պլան",
        "Ներկայացվում է բաժինների միջև աշխատանքների համակարգման և փաստաթղթերի փոխանցման պլանը։",
        "Operations",
        "REQUEST",
    ),
]


class Command(BaseCommand):
    help = "Insert 10 Armenian-language sample documents."

    def handle(self, *args, **options):
        creator = (
            User.objects.filter(username="admin").first()
            or User.objects.filter(is_superuser=True, is_active=True).order_by("id").first()
            or User.objects.filter(is_active=True).order_by("id").first()
        )
        if not creator:
            self.stderr.write(self.style.ERROR("No active user found. Run seed_data or create an admin user first."))
            return

        pending_status, _ = DocumentStatus.objects.get_or_create(
            code="PENDING",
            defaults={"name": "Pending Approval"},
        )
        internal_level, _ = ConfidentialityLevel.objects.get_or_create(
            code="INTERNAL",
            defaults={"name": "Internal"},
        )

        created_count = 0
        skipped_count = 0

        for index, (title, description, department_name, type_code) in enumerate(ARMENIAN_DOCUMENTS, start=1):
            department, _ = Department.objects.get_or_create(
                name=department_name,
                defaults={"description": f"{department_name} Department"},
            )
            document_type, _ = DocumentType.objects.get_or_create(
                code=type_code,
                defaults={"name": type_code.title()},
            )
            external_reference = f"ARM-SAMPLE-{index:03d}"

            _, created = Document.objects.get_or_create(
                external_reference=external_reference,
                defaults={
                    "title": title,
                    "description": description,
                    "document_type": document_type,
                    "status": pending_status,
                    "confidentiality_level": internal_level,
                    "creator": creator,
                    "current_owner": creator,
                    "department": department,
                },
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Inserted {created_count} Armenian documents. Skipped {skipped_count} existing documents."
            )
        )
