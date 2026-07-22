from django.db import migrations, models
import django.db.models.deletion


def generate_dependency_list():
    return [
        ('jobs', '0001_initial'),
        ('users', '0001_initial'),
    ]


class Migration(migrations.Migration):
    initial = True

    dependencies = generate_dependency_list()

    operations = [
        migrations.CreateModel(
            name='JobApplication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('applied', 'Applied'), ('reviewed', 'Reviewed'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='applied', max_length=20)),
                ('cover_letter', models.TextField(blank=True, default='')),
                ('applied_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('job_posting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='job_applications', to='jobs.jobposting')),
                ('job_seeker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='job_applications', to='users.jobseeker')),
            ],
            options={
                'ordering': ['-applied_at'],
                'unique_together': {('job_seeker', 'job_posting')},
            },
        ),
    ]
