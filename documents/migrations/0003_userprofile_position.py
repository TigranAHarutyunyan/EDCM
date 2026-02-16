from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("documents", "0002_confidentialitylevel_notificationtype_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="position",
            field=models.CharField(max_length=150, blank=True),
        ),
    ]

