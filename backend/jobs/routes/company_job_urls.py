from django.urls import path

from applications.views import company_applications_list, company_application_detail
from ..views.company_job_views import company_jobs_list_create, company_job_detail

urlpatterns = [
    path('', company_jobs_list_create, name='company_jobs_list_create'),
    path('<int:pk>/', company_job_detail, name='company_job_detail'),
    path('applications/', company_applications_list, name='company_applications_list'),
    path('applications/<int:pk>/', company_application_detail, name='company_application_detail'),
]
