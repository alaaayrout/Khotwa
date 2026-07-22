from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView


from users.models import JobSeeker, Company
from seeker_profiles.models import SeekerProfile
from jobs.models import JobPosting, Specialization  

from .authentication import AdminTokenAuthentication
from .models import AdminUser, AdminAuthToken, JobDeletionLog
from .pagination import AdminPagination
from .permissions import IsAdminUser
from .serializers import (
    AdminLoginSerializer,
    AdminSeekerSerializer,
    AdminSeekerUpdateSerializer,
    AdminCompanySerializer,
    AdminCompanyRejectSerializer,
    AdminJobListSerializer,
    AdminJobDetailSerializer,
    AdminJobDeleteSerializer,
    AdminCVSerializer,
    AdminCategorySerializer,
)



class AdminBaseView:
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAdminUser]


class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data["password"]

        admin = AdminUser.objects.filter(email__iexact=email).first()
        if not admin or not admin.check_password(password):
            return Response({"error": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        if not admin.is_active:
            return Response({"error": "This admin account is disabled"}, status=status.HTTP_403_FORBIDDEN)

        token, _ = AdminAuthToken.objects.get_or_create(admin=admin)

        return Response(
            {
                "message": "Login successful",
                "token": token.key,
                "admin": {"id": admin.id, "full_name": admin.full_name, "email": admin.email},
            },
            status=status.HTTP_200_OK,
        )

# ---------------------------------------------------------------------------
# 1) Job Seekers
# ---------------------------------------------------------------------------
class AdminSeekerListView(AdminBaseView, generics.ListAPIView):
    serializer_class = AdminSeekerSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = JobSeeker.objects.all().order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(email__icontains=search))
        return qs


class AdminSeekerDetailView(AdminBaseView, generics.RetrieveUpdateDestroyAPIView):
    queryset = JobSeeker.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return AdminSeekerUpdateSerializer
        return AdminSeekerSerializer


# ---------------------------------------------------------------------------
# 2) Companies
# ---------------------------------------------------------------------------
class AdminCompanyListView(AdminBaseView, generics.ListAPIView):
    serializer_class = AdminCompanySerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = Company.objects.all().order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(company_name__icontains=search) | Q(email__icontains=search))
        return qs


class AdminCompanyDetailView(AdminBaseView, generics.RetrieveDestroyAPIView):
    queryset = Company.objects.all()
    serializer_class = AdminCompanySerializer

    def destroy(self, request, *args, **kwargs):
        company = self.get_object()
        try:
            send_mail(
                subject="تم حذف حساب شركتكم نهائياً",
                message=(
                    f"مرحباً {company.company_name}،\n"
                    f"تم حذف حسابكم وكل الإعلانات المرتبطة فيه نهائياً من المنصة."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[company.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return super().destroy(request, *args, **kwargs)


class AdminCompanyApproveView(AdminBaseView, APIView):
    def post(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        company.approve()
        JobPosting.objects.filter(company=company).update(is_active=True)
        if not company.approval_email_sent:
            try:
                send_mail(
                    subject="تمت الموافقة على حساب شركتكم",
                    message=f"مرحباً {company.company_name}،\nتمت الموافقة على حسابكم على المنصة.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[company.email],
                    fail_silently=True,
                )
                company.approval_email_sent = True
                company.save(update_fields=["approval_email_sent"])
            except Exception:
                pass  

        return Response(AdminCompanySerializer(company).data)


class AdminCompanyRejectView(AdminBaseView, APIView):
    def post(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        serializer = AdminCompanyRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        was_approved = company.approval_status == "approved"

        company.rejection_reason = serializer.validated_data.get("reason", "")
        company.reject()
        company.save(update_fields=["rejection_reason"])

        if not company.rejection_email_sent:
            if was_approved:
                subject = "تم إلغاء تفعيل حساب شركتكم"
                message = (
                    f"مرحباً {company.company_name}،\n"
                    f"تم إلغاء تفعيل حسابكم على المنصة من قبل الإدارة.\n"
                    f"السبب: {company.rejection_reason or 'غير محدد'}"
                )
            else:
                subject = "بخصوص طلب تسجيل شركتكم"
                message = (
                    f"مرحباً {company.company_name}،\n"
                    f"للأسف تم رفض طلب تسجيل حسابكم.\n"
                    f"السبب: {company.rejection_reason or 'غير محدد'}"
                )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[company.email],
                    fail_silently=True,
                )
                company.rejection_email_sent = True
                company.save(update_fields=["rejection_email_sent"])
            except Exception:
                pass

        return Response(AdminCompanySerializer(company).data)


# ---------------------------------------------------------------------------
# 3) Jobs
# ---------------------------------------------------------------------------
class AdminJobListView(AdminBaseView, generics.ListAPIView):
    serializer_class = AdminJobListSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = JobPosting.objects.select_related("company").order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(company__company_name__icontains=search)
            )
        return qs


class AdminJobDetailView(AdminBaseView, generics.RetrieveUpdateDestroyAPIView):
    queryset = JobPosting.objects.all()
    serializer_class = AdminJobDetailSerializer

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        reason_serializer = AdminJobDeleteSerializer(data=request.data)
        reason_serializer.is_valid(raise_exception=True)

        JobDeletionLog.objects.create(
            job_id=job.id,
            job_title=job.title,
            company_name=job.company.company_name,
            deleted_by=request.user,
            reason=reason_serializer.validated_data["reason"],
        )
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminJobSuspendView(AdminBaseView, APIView):
    def post(self, request, pk):
        job = get_object_or_404(JobPosting, pk=pk)
        job.is_active = False
        job.save(update_fields=["is_active"])
        return Response(AdminJobListSerializer(job).data)


class AdminJobActivateView(AdminBaseView, APIView):
    def post(self, request, pk):
        job = get_object_or_404(JobPosting, pk=pk)
        job.is_active = True
        job.save(update_fields=["is_active"])
        return Response(AdminJobListSerializer(job).data)



class AdminCVListView(AdminBaseView, generics.ListAPIView):
    serializer_class = AdminCVSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = (
            SeekerProfile.objects.select_related("user")
            .exclude(cv_file="")
            .filter(cv_file__isnull=False)
            .order_by("-updated_at")
        )
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(user__full_name__icontains=search)
        return qs

    def get_serializer_context(self):
        return {"request": self.request}


class AdminCVDetailView(AdminBaseView, APIView):
    def delete(self, request, pk):
        profile = get_object_or_404(SeekerProfile, pk=pk)
        if profile.cv_file:
            profile.cv_file.delete(save=False)  
        profile.cv_file = None
        profile.save(update_fields=["cv_file"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 5) Categories (= Specialization)
# ---------------------------------------------------------------------------
class AdminCategoryListCreateView(AdminBaseView, generics.ListCreateAPIView):
    serializer_class = AdminCategorySerializer
    pagination_class = None  

    def get_queryset(self):
        return AdminCategorySerializer.annotate_queryset(Specialization.objects.all())


class AdminCategoryDetailView(AdminBaseView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminCategorySerializer

    def get_queryset(self):
        return AdminCategorySerializer.annotate_queryset(Specialization.objects.all())

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {"detail": "لا يمكنك  حذف هذا التصنيف — يوجد وظائف مرتبطة فيه."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
