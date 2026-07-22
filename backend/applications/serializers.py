from rest_framework import serializers
from .models import JobApplication
from seeker_profiles.models import SeekerProfile


class ApplicantProfileSerializer(serializers.ModelSerializer):

    skills = serializers.SerializerMethodField()
    experiences = serializers.SerializerMethodField()
    education_entries = serializers.SerializerMethodField()
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number")

    class Meta:
        model = SeekerProfile
        fields = [
            "full_name",
            "email",
            "phone_number",
            "governorate",
            "bio",
            "cv_file",
            "profile_picture",
            "skills",
            "experiences",
            "education_entries",
        ]


    def get_skills(self, obj):
        return list(
            obj.skills.values("name")
        )


    def get_experiences(self, obj):
        return list(
            obj.experiences.values(
                "title",
                "company",
                "date_from",
                "date_to",
                "current"
            )
        )


    def get_education_entries(self, obj):
        return list(
            obj.education_entries.values(
                "degree",
                "institution",
                "year"
            )
        )
    
class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_posting.title', read_only=True)
    company_name = serializers.CharField(source='job_posting.company.company_name', read_only=True)
    seeker_name = serializers.CharField(source='job_seeker.full_name', read_only=True)
    seeker_email = serializers.CharField(source='job_seeker.email', read_only=True)
    job_required_skills = serializers.ListField(
        source='job_posting.required_skills',
        child=serializers.CharField(),
        read_only=True
    )
    seeker_skills = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'job_title',
            'company_name',
            'seeker_name',
            'seeker_email',
            'status',
            'cover_letter',
            'applied_at',
            'updated_at',
            'job_required_skills',
            'seeker_skills',
        ]

    def get_seeker_skills(self, obj):
        """استخراج مهارات الباحث من SeekerProfile"""
        try:
            seeker_profile = obj.job_seeker.seeker_profile
            skills = seeker_profile.skills.values_list('name', flat=True)
            return list(skills)
        except:
            return []


class JobApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ['status']




class CompanyApplicationSerializer(serializers.ModelSerializer):

    applicant_profile = ApplicantProfileSerializer(
        source="job_seeker.seeker_profile",
        read_only=True
    )


    class Meta:
        model = JobApplication
        fields = [
            "id",
            "status",
            "cover_letter",
            "applied_at",
            "applicant_profile",
        ]
