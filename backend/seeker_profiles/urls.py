from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    SeekerProfileView, SeekerCVUploadView, SeekerProfilePictureUploadView, 
    SkillViewSet, ExperienceViewSet, EducationViewSet,
)

router = DefaultRouter()
router.register("skills", SkillViewSet, basename="seeker-skill")
router.register("experience", ExperienceViewSet, basename="seeker-experience")
router.register("education", EducationViewSet, basename="seeker-education")

urlpatterns = [
    path("seeker/profile/", SeekerProfileView.as_view(), name="seeker-profile"),
    path("seeker/profile/cv/", SeekerCVUploadView.as_view(), name="seeker-cv"),
    path("seeker/profile/picture/", SeekerProfilePictureUploadView.as_view(), name="seeker-picture"), 
    path("seeker/", include(router.urls)),
]