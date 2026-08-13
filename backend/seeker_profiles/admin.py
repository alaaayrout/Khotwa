from django.contrib import admin
from django.utils.html import format_html
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
    list_display = (
    "user",
    "governorate",
    "display_skills",
    "display_experiences",
    "display_education",
    "display_cv",
    "display_picture",
    "updated_at",
)
    search_fields = ("user__email", "user__full_name")
    list_filter = ("governorate",)
    inlines = [SkillInline, ExperienceInline, EducationInline]

    def display_skills(self, obj):
        return ", ".join(skill.name for skill in obj.skills.all())
    display_skills.short_description = "Skills"

    def display_experiences(self, obj):
        return ", ".join(
            f"{exp.title} - {exp.company}"
            for exp in obj.experiences.all()
        )
    display_experiences.short_description = "Experience"

    def display_education(self, obj):
        return ", ".join(
            f"{edu.degree} - {edu.institution}"
            for edu in obj.education_entries.all()
        )
    display_education.short_description = "Education"

    def display_cv(self, obj):
        if obj.cv_file:
            return format_html(
                '<a href="{}" target="_blank">View CV</a>',
                obj.cv_file.url
            )
        return "No CV"

    display_cv.short_description = "CV"

    def display_picture(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 50%;" />',
                obj.profile_picture.url
            )
        return "No Picture"

    display_picture.short_description = "Picture"
           

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