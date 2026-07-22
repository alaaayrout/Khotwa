from django.db.models import Count
from rest_framework import serializers

from users.models import JobSeeker, Company
from seeker_profiles.models import SeekerProfile

from jobs.models import JobPosting, Specialization


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

# ---------------------------------------------------------------------------
# 1) Job Seekers
# ---------------------------------------------------------------------------
class AdminSeekerSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="phone_number")
    date_joined = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = JobSeeker
        fields = ["id", "full_name", "email", "phone", "date_joined", "is_active"]


class AdminSeekerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSeeker
        fields = ["is_active"]


# ---------------------------------------------------------------------------
# 2) Companies
# ---------------------------------------------------------------------------
class AdminCompanySerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="company_name")
    sector = serializers.CharField(source="company_type")
   
    status = serializers.CharField(source="approval_status", read_only=True)

    class Meta:
        model = Company
        fields = ["id", "name", "email", "sector", "status"]


class AdminCompanyRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


# ---------------------------------------------------------------------------
# 3) Jobs
# ---------------------------------------------------------------------------
class AdminJobListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.company_name", read_only=True)
    governorate = serializers.CharField(source="city")
   
    status = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = ["id", "title", "company_name", "governorate", "created_at", "status"]

    def get_status(self, obj):
        return "active" if obj.is_active else "suspended"

class AdminJobDeleteSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)

class AdminJobDetailSerializer(serializers.ModelSerializer):
    governorate = serializers.CharField(source="city")

    class Meta:
        model = JobPosting
        fields = [
            "id", "title", "description", "governorate", "employment_type",
            "work_mode", "specialization", "expires_at", "status", "is_active",
            "created_at", "updated_at",
        ]


class AdminCVSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    seeker_name = serializers.CharField(source="user.full_name")
    file_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source="updated_at")

    def get_file_name(self, obj):
        return obj.cv_file.name.split("/")[-1] if obj.cv_file else None

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.cv_file:
            return None
        url = obj.cv_file.url
        return request.build_absolute_uri(url) if request else url


# ---------------------------------------------------------------------------
# 5) Categories 
# ---------------------------------------------------------------------------
class AdminCategorySerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Specialization
        fields = ["id", "name_ar", "name_en", "jobs_count"]

    @staticmethod
    def annotate_queryset(queryset):
        return queryset.annotate(jobs_count=Count("job_postings"))
