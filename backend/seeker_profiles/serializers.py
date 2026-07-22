from rest_framework import serializers
from .models import SeekerProfile, Skill, Experience, Education


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ["id", "title", "company", "date_from", "date_to", "current"]

    def validate(self, data):
        if not data.get("current") and not data.get("date_to"):
            raise serializers.ValidationError({"date_to": "required"})
        return data


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ["id", "degree", "institution", "year"]

    def validate_year(self, value):
        if value < 1950 or value > 2100:
            raise serializers.ValidationError("year_invalid")
        return value


class SeekerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name")
    email = serializers.EmailField(source="user.email", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number")
    skills = SkillSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    education_entries = EducationSerializer(many=True, read_only=True)
    cv_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = SeekerProfile
        fields = [
            "full_name", "email", "phone_number", "governorate", "bio",
            "cv_url", "profile_picture_url", "skills", "experiences",
            "completion_percentage","education_entries","cv_url","profile_picture",
        ]

    def get_cv_url(self, obj):
        request = self.context.get("request")
        if obj.cv_file and request:
            return request.build_absolute_uri(obj.cv_file.url)
        return None

    def get_profile_picture_url(self, obj):
     request = self.context.get("request")
     if obj.profile_picture and request:
        return request.build_absolute_uri(obj.profile_picture.url)
     if obj.external_picture_url:
        return obj.external_picture_url
     return None

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("required")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance