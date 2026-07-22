from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from jobs.models import JobPosting
from jobs.models.specialization import Specialization
from users.models import Company, JobSeeker
from seeker_profiles.models import JobSeekerAuthToken
from .models import JobApplication


class JobApplicationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.company = Company.objects.create(
            company_name='Test Company',
            email='company@example.com',
            phone_number='+963991234567',
            password='secret123',
            governorate='damascus',
            company_type='programming',
            description='Test company',
            approval_status='approved',
            is_active=True,
        )
        self.specialization = Specialization.objects.create(name_ar='برمجة', name_en='Programming')
        self.job = JobPosting.objects.create(
            company=self.company,
            title='Python Developer',
            description='Need Python dev',
            specialization=self.specialization,
            city='damascus',
            employment_type='full_time',
            work_mode='remote',
            status='open',
            expires_at='2099-12-31',
            is_active=True,
        )

        self.job_seeker = JobSeeker.objects.create(
            full_name='Test Seeker',
            email='seeker@example.com',
            phone_number='+963991234568',
            password='secret123',
            is_active=True,
        )
        self.token = JobSeekerAuthToken.objects.create(job_seeker=self.job_seeker)

    def test_job_seeker_can_apply_for_job(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'JobSeekerToken {self.token.key}')
        response = self.client.post(reverse('job-apply', kwargs={'job_id': self.job.id}))

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobApplication.objects.count(), 1)
        self.assertEqual(JobApplication.objects.first().job_seeker, self.job_seeker)
        self.assertEqual(JobApplication.objects.first().job_posting, self.job)

    def test_duplicate_application_is_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'JobSeekerToken {self.token.key}')
        self.client.post(reverse('job-apply', kwargs={'job_id': self.job.id}))
        response = self.client.post(reverse('job-apply', kwargs={'job_id': self.job.id}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(JobApplication.objects.count(), 1)
