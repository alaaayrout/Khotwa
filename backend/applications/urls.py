from django.urls import path
from .views import CompanyJobApplicationsView



urlpatterns = [
    path(
        "company/applications/",
        CompanyJobApplicationsView.as_view(),
        name="company-applications"
    ),
]


