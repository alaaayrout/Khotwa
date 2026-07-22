"""
CRUD التخصصات — ميزة مستقلة.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..authentication import CompanyTokenAuthentication
from ..models import Specialization
from ..permissions import IsApprovedCompany
from ..serializers import (
    SpecializationSerializer,
    SpecializationCreateUpdateSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def specialization_list(request):
    """
    GET /api/jobs/specializations/

    جلب كل التخصصات النشطة.
    """
    queryset = Specialization.objects.filter(is_active=True)
    serializer = SpecializationSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def specialization_detail(request, pk):
    """
    GET /api/jobs/specializations/<id>/

    جلب تخصص واحد.
    """
    try:
        specialization = Specialization.objects.get(pk=pk, is_active=True)
    except Specialization.DoesNotExist:
        return Response({'error': 'Specialization not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SpecializationSerializer(specialization)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def specialization_create(request):
    """
    POST /api/jobs/specializations/create/

    إضافة تخصص جديد — يتطلب CompanyToken.
    """
    serializer = SpecializationCreateUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    specialization = serializer.save()
    return Response(
        SpecializationSerializer(specialization).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PUT', 'PATCH'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def specialization_update(request, pk):
    """
    PUT/PATCH /api/jobs/specializations/<id>/update/

    تعديل تخصص — يتطلب CompanyToken.
    """
    try:
        specialization = Specialization.objects.get(pk=pk)
    except Specialization.DoesNotExist:
        return Response({'error': 'Specialization not found'}, status=status.HTTP_404_NOT_FOUND)

    partial = request.method == 'PATCH'
    serializer = SpecializationCreateUpdateSerializer(
        specialization, data=request.data, partial=partial,
    )
    serializer.is_valid(raise_exception=True)
    specialization = serializer.save()
    return Response(SpecializationSerializer(specialization).data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@authentication_classes([CompanyTokenAuthentication])
@permission_classes([IsApprovedCompany])
def specialization_delete(request, pk):
    """
    DELETE /api/jobs/specializations/<id>/delete/

    حذف تخصص (حذف ناعم عبر is_active=False) — يتطلب CompanyToken.
    """
    try:
        specialization = Specialization.objects.get(pk=pk)
    except Specialization.DoesNotExist:
        return Response({'error': 'Specialization not found'}, status=status.HTTP_404_NOT_FOUND)

    specialization.is_active = False
    specialization.save(update_fields=['is_active', 'updated_at'])
    return Response(
        {'message': 'Specialization deleted successfully'},
        status=status.HTTP_200_OK,
    )
