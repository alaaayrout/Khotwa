"""
جلب القوائم الثابتة للوظائف (مدن، أنواع دوام، طرق عمل، حالات نشر).
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..serializers import JobChoicesSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_job_choices(request):
    """
    GET /api/jobs/choices/

    يُستخدم لملء القوائم المنسدلة في واجهة نشر الوظيفة.
    """
    serializer = JobChoicesSerializer({})
    return Response(serializer.data, status=status.HTTP_200_OK)
