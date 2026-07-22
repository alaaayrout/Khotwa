"""
إدارة الوظائف من قبل الشركة — إنشاء، تعديل، حذف، جلب وظائف الشركة.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response

from ..authentication import CompanyTokenAuthentication
from ..models import JobPosting
from ..permissions import IsApprovedCompany
from ..serializers import (
    JobPostingCreateSerializer,
    JobPostingUpdateSerializer,
    CompanyJobPostingSerializer,
)


@api_view(['GET', 'POST'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def company_jobs_list_create(request):
    """
    GET  /api/jobs/company/jobs/  — جلب وظائف الشركة الحالية
    POST /api/jobs/company/jobs/  — إنشاء وظيفة جديدة
    """
    company = request.auth

    if request.method == 'GET':
        jobs = JobPosting.objects.filter(company=company).select_related('specialization')
        serializer = CompanyJobPostingSerializer(jobs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = JobPostingCreateSerializer(
        data=request.data,
        context={'company': company},
    )
    serializer.is_valid(raise_exception=True)
    job = serializer.save()
    job = JobPosting.objects.select_related('specialization', 'company').get(pk=job.pk)
    return Response(
        CompanyJobPostingSerializer(job, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def company_job_detail(request, pk):
    """
    GET    /api/jobs/company/jobs/<id>/  — تفاصيل وظيفة للشركة
    PUT    /api/jobs/company/jobs/<id>/  — تعديل كامل
    PATCH  /api/jobs/company/jobs/<id>/  — تعديل جزئي
    DELETE /api/jobs/company/jobs/<id>/  — حذف الوظيفة
    """
    company = request.auth

    try:
        job = JobPosting.objects.select_related('specialization', 'company').get(
            pk=pk, company=company,
        )
    except JobPosting.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(
            CompanyJobPostingSerializer(job, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    if request.method == 'DELETE':
        job.delete()
        return Response(
            {'message': 'Job deleted successfully'},
            status=status.HTTP_200_OK,
        )

    partial = request.method == 'PATCH'
    serializer = JobPostingUpdateSerializer(job, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    job = serializer.save()
    return Response(
        CompanyJobPostingSerializer(job, context={'request': request}).data,
        status=status.HTTP_200_OK,
    )