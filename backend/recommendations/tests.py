from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from jobs.models import JobPosting
from jobs.models.specialization import Specialization
from seeker_profiles.models import JobSeekerAuthToken
from users.models import Company, JobSeeker


class RecommendationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(
            company_name='Rec Company',
            email='rec@example.com',
            phone_number='+963991234589',
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
            description='Build backend services with Python',
            specialization=self.specialization,
            city='damascus',
            employment_type='full_time',
            work_mode='remote',
            status='open',
            expires_at='2099-12-31',
            is_active=True,
        )
        self.job_seeker = JobSeeker.objects.create(
            full_name='Python Developer',
            email='developer@example.com',
            phone_number='+963991234590',
            password='secret123',
            is_active=True,
        )
        from seeker_profiles.models import SeekerProfile

        self.seeker_profile = SeekerProfile.objects.create(
            user=self.job_seeker,
            bio='I love Python backend development and Django.',
            governorate='damascus',
        )
        self.token = JobSeekerAuthToken.objects.create(job_seeker=self.job_seeker)

    def test_recommendations_return_ranked_jobs(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'JobSeekerToken {self.token.key}')
        response = self.client.get(reverse('recommended-jobs'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.json(), list))
        self.assertGreaterEqual(len(response.json()), 1)
