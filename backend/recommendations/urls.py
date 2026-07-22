from django.urls import path

from .views import recommended_jobs_for_seeker

urlpatterns = [
    path('jobs/', recommended_jobs_for_seeker, name='recommended-jobs'),
]
