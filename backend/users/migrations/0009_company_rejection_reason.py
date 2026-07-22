from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_alter_company_company_type_alter_company_governorate'),
    ]

    operations = [
        migrations.AddField(
            model_name='company',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True, help_text='Reason for rejection if the company registration was rejected'),
        ),
    ]
