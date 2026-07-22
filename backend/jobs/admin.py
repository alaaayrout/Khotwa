from django.contrib import admin

from .models import Specialization, JobPosting, CompanyAuthToken


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name_ar', 'name_en']


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'company', 'city', 'employment_type',
        'work_mode', 'status', 'expires_at', 'is_active', 'views_count',
    ]
    list_filter = ['status', 'city', 'employment_type', 'work_mode', 'is_active']
    search_fields = ['title', 'company__company_name']
    raw_id_fields = ['company', 'specialization']


@admin.register(CompanyAuthToken)
class CompanyAuthTokenAdmin(admin.ModelAdmin):
    list_display = ['company', 'key', 'created_at']
    search_fields = ['company__company_name', 'company__email']
