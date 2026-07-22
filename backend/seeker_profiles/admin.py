from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import SeekerProfile, Skill, Experience, Education


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1


class ExperienceInline(admin.TabularInline):
    model = Experience
    extra = 0


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


@admin.register(SeekerProfile)
class SeekerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "governorate", "updated_at")
    search_fields = ("user__email", "user__full_name")
    list_filter = ("governorate",)
    inlines = [SkillInline, ExperienceInline, EducationInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "profile")
    search_fields = ("name",)


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "profile", "date_from", "date_to", "current")


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ("degree", "institution", "year", "profile")