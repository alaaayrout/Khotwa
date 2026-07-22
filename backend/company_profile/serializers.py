from rest_framework import serializers
from .models import CompanyProfile
from users.models import Company


class CompanyProfileSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name')
    email = serializers.EmailField(source='company.email', read_only=True)
    phone_number = serializers.CharField(source='company.phone_number')
    governorate = serializers.CharField(source='company.governorate')
    company_type = serializers.CharField(source='company.company_type')
    website_url = serializers.URLField(source='company.website_url', allow_null=True, required=False)
    description = serializers.CharField(source='company.description')
    approval_status = serializers.CharField(source='company.approval_status', read_only=True)
    rejection_reason = serializers.CharField(source='company.rejection_reason', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CompanyProfile
        fields = [
            'company_name', 'email', 'phone_number', 'governorate', 'company_type',
            'website_url', 'description', 'approval_status', 'rejection_reason',
            'profile_picture', 'profile_picture_url', 'external_picture_url', 'linkedin_url'
        ]

    def get_profile_picture_url(self, obj):
     request = self.context.get('request')
     if obj.profile_picture and request:
        return request.build_absolute_uri(obj.profile_picture.url)
     if obj.external_picture_url:
        return obj.external_picture_url
     return None

    def validate_company_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('required')
        return value

    def update(self, instance, validated_data):
        company_data = validated_data.pop('company', {})
        # update company fields
        for attr, value in company_data.items():
            setattr(instance.company, attr, value)
        instance.company.save()

        # update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
