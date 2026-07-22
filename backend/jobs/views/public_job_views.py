"""
عرض الوظائف للمستخدمين — جلب الكل وجلب حسب ID.
مخصص لواجهة التطبيق (باحثو العمل والزوار).
"""

from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import JobPosting
from ..serializers import JobPostingListSerializer, JobPostingDetailSerializer


def _public_jobs_queryset():
    """الوظائف الظاهرة للعامة: مفتوحة، نشطة، ولم تنتهِ مدتها."""
    today = timezone.localdate()
    return (
        JobPosting.objects
        .filter(status='open', is_active=True, expires_at__gte=today)
        .select_related('specialization', 'company')
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_job_list(request):
    """
    GET /api/jobs/

    جلب كل الوظائف المتاحة للعرض العام.
    يدعم فلترة اختيارية: ?city=damascus&employment_type=full_time&work_mode=remote
    """
    queryset = _public_jobs_queryset()

    city = request.query_params.get('city')
    if city:
        queryset = queryset.filter(city=city)

    employment_type = request.query_params.get('employment_type')
    if employment_type:
        queryset = queryset.filter(employment_type=employment_type)

    work_mode = request.query_params.get('work_mode')
    if work_mode:
        queryset = queryset.filter(work_mode=work_mode)

    specialization_id = request.query_params.get('specialization_id')
    if specialization_id:
        queryset = queryset.filter(specialization_id=specialization_id)

    serializer = JobPostingListSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_job_detail(request, pk):
    """
    GET /api/jobs/<id>/

    جلب تفاصيل وظيفة واحدة + زيادة عداد المشاهدات.
    """
    try:
        job = _public_jobs_queryset().get(pk=pk)
    except JobPosting.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    JobPosting.objects.filter(pk=job.pk).update(views_count=F('views_count') + 1)
    job.refresh_from_db()

    serializer = JobPostingDetailSerializer(job, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
