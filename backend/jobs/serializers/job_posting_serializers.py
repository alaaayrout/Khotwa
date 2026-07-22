from django.utils import timezone
from rest_framework import serializers

from ..models import JobPosting, Specialization


class SpecializationNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name_ar', 'name_en']


class CompanyNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    company_name = serializers.CharField()
    governorate = serializers.CharField()
    company_type = serializers.CharField()


class JobPostingCreateSerializer(serializers.ModelSerializer):
    """إنشاء وظيفة جديدة — للشركات المعتمدة."""

    specialization_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialization.objects.filter(is_active=True),
        source='specialization',
    )

    class Meta:
        model = JobPosting
        fields = [
            'title',
            'description',
            'specialization_id',
            'city',
            'employment_type',
            'work_mode',
            'status',
            'expires_at',
            'is_active',
        ]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Job title is required.')
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Job description is required.')
        return value

    def validate_expires_at(self, value):
        if value <= timezone.localdate():
            raise serializers.ValidationError('Expiration date must be in the future.')
        return value

    def create(self, validated_data):
        company = self.context['company']
        return JobPosting.objects.create(company=company, **validated_data)


class JobPostingUpdateSerializer(serializers.ModelSerializer):
    """تعديل وظيفة — للشركة المالكة فقط."""

    specialization_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialization.objects.filter(is_active=True),
        source='specialization',
        required=False,
    )

    class Meta:
        model = JobPosting
        fields = [
            'title',
            'description',
            'specialization_id',
            'city',
            'employment_type',
            'work_mode',
            'status',
            'expires_at',
            'is_active',
        ]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Job title is required.')
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Job description is required.')
        return value

    def validate_expires_at(self, value):
        if value <= timezone.localdate():
            raise serializers.ValidationError('Expiration date must be in the future.')
        return value


class JobPostingListSerializer(serializers.ModelSerializer):
    """قائمة الوظائف — للعرض العام."""

    specialization = SpecializationNestedSerializer(read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    city_label = serializers.SerializerMethodField()
    employment_type_label = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()
    work_mode_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = [
            'id',
            'title',
            'company_name',
            'company_logo_url',
            'specialization',
            'city',
            'city_label',
            'employment_type',
            'employment_type_label',
            'work_mode',
            'work_mode_label',
            'status',
            'status_label',
            'expires_at',
            'created_at',
            'views_count',
        ]
    def get_company_logo_url(self, obj):
        profile = getattr(obj.company, 'profile', None)
        if not profile:
            return None

        if profile.profile_picture:
            request = self.context.get('request')
            url = profile.profile_picture.url
            return request.build_absolute_uri(url) if request else url

        if profile.external_picture_url:
            return profile.external_picture_url

        return None
    
    def _label_from_choices(self, obj, field_name):
        field = JobPosting._meta.get_field(field_name)
        return dict(field.choices).get(getattr(obj, field_name), '')

    def get_city_label(self, obj):
        return self._label_from_choices(obj, 'city')

    def get_employment_type_label(self, obj):
        return self._label_from_choices(obj, 'employment_type')

    def get_work_mode_label(self, obj):
        return self._label_from_choices(obj, 'work_mode')

    def get_status_label(self, obj):
        return self._label_from_choices(obj, 'status')


class JobPostingDetailSerializer(JobPostingListSerializer):
    """تفاصيل وظيفة — للعرض العام."""

    company = serializers.SerializerMethodField()
    description = serializers.CharField()

    class Meta(JobPostingListSerializer.Meta):
        fields = JobPostingListSerializer.Meta.fields + [
            'description',
            'company',
            'is_active',
            'updated_at',
        ]

    def get_company(self, obj):
        return {
            'id': obj.company.id,
            'company_name': obj.company.company_name,
            'governorate': obj.company.governorate,
            'company_type': obj.company.company_type,
            'website_url': obj.company.website_url or '',
            'description': obj.company.description,
            'company_logo_url': self.get_company_logo_url(obj),
        }


class CompanyJobPostingSerializer(JobPostingDetailSerializer):
    """عرض وظائف الشركة — يتضمن كل الحقول لإدارتها."""

    class Meta(JobPostingDetailSerializer.Meta):
        fields = JobPostingDetailSerializer.Meta.fields
