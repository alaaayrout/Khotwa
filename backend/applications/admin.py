from django.contrib import admin

from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('job_seeker', 'job_posting', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('job_seeker__full_name', 'job_seeker__email', 'job_posting__title')
