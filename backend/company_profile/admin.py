
from django.contrib import admin
from .models import CompanyProfile


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = [
        "company",
        "linkedin_url",
        "profile_picture_preview",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "company__company_name",
        "company__email",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]
    def profile_picture_preview(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit:cover;" />',
                obj.profile_picture.url
            )
        return "No image"

    profile_picture_preview.short_description = "Profile Picture"