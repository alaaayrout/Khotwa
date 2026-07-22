from rest_framework import serializers

from ..constants import (
    SYRIAN_CITY_CHOICES,
    EMPLOYMENT_TYPE_CHOICES,
    WORK_MODE_CHOICES,
    JOB_STATUS_CHOICES,
)


class JobChoicesSerializer(serializers.Serializer):
    """جلب القوائم الثابتة: المدن، أنواع الدوام، طرق العمل، حالات النشر."""

    cities = serializers.SerializerMethodField()
    employment_types = serializers.SerializerMethodField()
    work_modes = serializers.SerializerMethodField()
    job_statuses = serializers.SerializerMethodField()

    def _to_options(self, choices):
        return [{'value': v, 'label': l} for v, l in choices]

    def get_cities(self, obj):
        return self._to_options(SYRIAN_CITY_CHOICES)

    def get_employment_types(self, obj):
        return self._to_options(EMPLOYMENT_TYPE_CHOICES)

    def get_work_modes(self, obj):
        return self._to_options(WORK_MODE_CHOICES)

    def get_job_statuses(self, obj):
        return self._to_options(JOB_STATUS_CHOICES)
