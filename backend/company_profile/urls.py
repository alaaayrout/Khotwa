from django.urls import path
from .views import CompanyProfilePictureUploadView, CompanyProfileView

urlpatterns = [
    path('company/profile/', CompanyProfileView.as_view(), name='company-profile'),
    path('company/profile/picture/', CompanyProfilePictureUploadView.as_view(), name='company-profile-picture'),
]
