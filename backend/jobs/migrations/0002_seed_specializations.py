from django.db import migrations


DEFAULT_SPECIALIZATIONS = [
    ('هندسة البرمجيات', 'Software Engineering'),
    ('تصميم', 'Design'),
    ('علوم البيانات', 'Data Science'),
    ('تسويق', 'Marketing'),
    ('مالية ومحاسبة', 'Finance'),
    ('موارد بشرية', 'Human Resources'),
    ('مبيعات', 'Sales'),
    ('عمليات', 'Operations'),
    ('أخرى', 'Other'),
]


def seed_specializations(apps, schema_editor):
    Specialization = apps.get_model('jobs', 'Specialization')
    for name_ar, name_en in DEFAULT_SPECIALIZATIONS:
        Specialization.objects.get_or_create(
            name_ar=name_ar,
            name_en=name_en,
            defaults={'is_active': True},
        )


def unseed_specializations(apps, schema_editor):
    Specialization = apps.get_model('jobs', 'Specialization')
    names = [item[0] for item in DEFAULT_SPECIALIZATIONS]
    Specialization.objects.filter(name_ar__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_specializations, unseed_specializations),
    ]
