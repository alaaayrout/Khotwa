from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SeekerProfile, Skill, Experience, Education
from .authentication import JobSeekerTokenAuthentication
from .permissions import IsJobSeekerAuthenticated
from .serializers import (
    SeekerProfileSerializer, SkillSerializer,
    ExperienceSerializer, EducationSerializer,
)



class SeekerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = SeekerProfileSerializer
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def get_object(self):
        profile, _ = SeekerProfile.objects.get_or_create(user=self.request.auth)
        return profile


class SeekerCVUploadView(APIView):
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def post(self, request):
        profile, _ = SeekerProfile.objects.get_or_create(user=request.auth)
        file = request.FILES.get("cv_file")
        if not file:
            return Response({"cv_file": "required"}, status=status.HTTP_400_BAD_REQUEST)

        profile.cv_file = file
        try:
            profile.full_clean()
        except Exception:
            return Response({"cv_file": "cv_invalid"}, status=status.HTTP_400_BAD_REQUEST)

        profile.save()
        return Response(SeekerProfileSerializer(profile, context={"request": request}).data)

    def delete(self, request):
        profile = SeekerProfile.objects.filter(user=request.auth).first()
        if profile and profile.cv_file:
            profile.cv_file.delete(save=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SeekerProfilePictureUploadView(APIView):
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def post(self, request):
        profile, _ = SeekerProfile.objects.get_or_create(user=request.auth)
        file = request.FILES.get("profile_picture")
        if not file:
            return Response({"profile_picture": "required"}, status=status.HTTP_400_BAD_REQUEST)

        profile.profile_picture = file
        try:
            profile.full_clean()
        except Exception:
            return Response({"profile_picture": "picture_invalid"}, status=status.HTTP_400_BAD_REQUEST)

        profile.save()
        return Response(SeekerProfileSerializer(profile, context={"request": request}).data)

    def delete(self, request):
        profile = SeekerProfile.objects.filter(user=request.auth).first()
        if profile and profile.profile_picture:
            profile.profile_picture.delete(save=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(profile__user=self.request.auth)

    def perform_create(self, serializer):
        profile, _ = SeekerProfile.objects.get_or_create(user=self.request.auth)
        serializer.save(profile=profile)


class ExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ExperienceSerializer
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(profile__user=self.request.auth)

    def perform_create(self, serializer):
        profile, _ = SeekerProfile.objects.get_or_create(user=self.request.auth)
        serializer.save(profile=profile)


class EducationViewSet(viewsets.ModelViewSet):
    serializer_class = EducationSerializer
    authentication_classes = [JobSeekerTokenAuthentication]
    permission_classes = [IsJobSeekerAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(profile__user=self.request.auth)

    def perform_create(self, serializer):
        profile, _ = SeekerProfile.objects.get_or_create(user=self.request.auth)
        serializer.save(profile=profile)