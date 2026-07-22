from rest_framework import serializers

from ..models import Specialization


class SpecializationSerializer(serializers.ModelSerializer):
    """عرض التخصص — للقوائم المنسدلة والجلب العام."""

    class Meta:
        model = Specialization
        fields = ['id', 'name_ar', 'name_en', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SpecializationCreateUpdateSerializer(serializers.ModelSerializer):
    """إنشاء وتعديل التخصص."""

    class Meta:
        model = Specialization
        fields = ['name_ar', 'name_en', 'is_active']

    def validate_name_ar(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Arabic name is required.')
        return value

    def validate_name_en(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('English name is required.')
        return value
