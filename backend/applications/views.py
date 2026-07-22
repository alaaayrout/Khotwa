from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from jobs.models import JobPosting
from jobs.authentication import CompanyTokenAuthentication
from jobs.permissions import IsApprovedCompany
from seeker_profiles.authentication import JobSeekerTokenAuthentication
from seeker_profiles.permissions import IsJobSeekerAuthenticated
from .models import JobApplication
from .serializers import JobApplicationSerializer, JobApplicationStatusSerializer

from rest_framework.generics import ListAPIView
from .serializers import CompanyApplicationSerializer


class CompanyJobApplicationsView(ListAPIView):

    serializer_class = CompanyApplicationSerializer
    authentication_classes = [CompanyTokenAuthentication]
    permission_classes = [IsApprovedCompany]

    def get_queryset(self):
        company = self.request.auth

        return JobApplication.objects.filter(
            job_posting__company=company
        )


@api_view(['POST'])
@authentication_classes([JobSeekerTokenAuthentication])
@permission_classes([IsJobSeekerAuthenticated])
def apply_to_job(request, job_id):
    job_seeker = request.auth
    job_posting = get_object_or_404(JobPosting, pk=job_id)

    if job_posting.status != 'open' or not job_posting.is_active:
        return Response({'error': 'This job is no longer accepting applications.'}, status=status.HTTP_400_BAD_REQUEST)

    if job_posting.expires_at < timezone.localdate():
        return Response({'error': 'This job has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    has_applied = JobApplication.objects.filter(
        job_seeker=job_seeker,
        job_posting=job_posting,
    ).exists()
    if has_applied:
        return Response({'error': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        application = JobApplication.objects.create(
            job_seeker=job_seeker,
            job_posting=job_posting,
            cover_letter=request.data.get('cover_letter', ''),
        )
    except IntegrityError:
        return Response({'error': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(JobApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def company_applications_list(request):
    company = request.auth
    applications = JobApplication.objects.filter(job_posting__company=company).select_related('job_seeker', 'job_posting')
    serializer = JobApplicationSerializer(applications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def company_application_detail(request, pk):
    company = request.auth
    application = get_object_or_404(
        JobApplication.objects.select_related('job_seeker', 'job_posting__company'),
        pk=pk,
        job_posting__company=company,
    )

    if request.method == 'GET':
        serializer = JobApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = JobApplicationStatusSerializer(application, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(JobApplicationSerializer(application).data, status=status.HTTP_200_OK)
