from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import CompanyProfile
from .serializers import CompanyProfileSerializer
from .permissions import IsCompanyAuthenticated
from jobs.authentication import CompanyTokenAuthentication


class CompanyProfileView(generics.RetrieveUpdateAPIView):
	serializer_class = CompanyProfileSerializer
	authentication_classes = [CompanyTokenAuthentication]
	permission_classes = [IsCompanyAuthenticated]

	def get_object(self):
		profile, _ = CompanyProfile.objects.get_or_create(company=self.request.auth)
		return profile


class CompanyProfilePictureUploadView(APIView):
	authentication_classes = [CompanyTokenAuthentication]
	permission_classes = [IsCompanyAuthenticated]

	def post(self, request):
		profile, _ = CompanyProfile.objects.get_or_create(company=request.auth)
		file = request.FILES.get('profile_picture')
		if not file:
			return Response({'profile_picture': 'required'}, status=status.HTTP_400_BAD_REQUEST)

		profile.profile_picture = file
		try:
			profile.full_clean()
		except Exception:
			return Response({'profile_picture': 'profile_picture_invalid'}, status=status.HTTP_400_BAD_REQUEST)

		profile.save()
		return Response(CompanyProfileSerializer(profile, context={'request': request}).data)

	def delete(self, request):
		profile = CompanyProfile.objects.filter(company=request.auth).first()
		if profile and profile.profile_picture:
			profile.profile_picture.delete(save=True)
		return Response(status=status.HTTP_204_NO_CONTENT)
