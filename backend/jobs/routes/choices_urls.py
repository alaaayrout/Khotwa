from django.urls import path

from ..views.choices_views import get_job_choices

urlpatterns = [
    path('', get_job_choices, name='jobs_choices'),
]
