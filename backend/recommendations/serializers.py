from rest_framework import serializers


class JobRecommendationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    company_name = serializers.CharField()
    company_logo = serializers.CharField(allow_null=True, required=False)
    similarity_score = serializers.FloatField()
    city = serializers.CharField()
    employment_type = serializers.CharField()
    work_mode = serializers.CharField()
    status = serializers.CharField()
