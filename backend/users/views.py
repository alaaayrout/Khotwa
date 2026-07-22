import logging
from seeker_profiles.services.job_seeker_auth_service import get_or_create_job_seeker_token
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils.translation import get_language
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from admin_dashboard.models import AdminUser, AdminAuthToken
from .models import EmailVerification, JobSeeker, Company, GOVERNORATE_CHOICES, COMPANY_TYPE_CHOICES
from .serializers import (
    JobSeekerOTPRegisterSerializer, VerifyOTPSerializer,
    JobSeekerLoginSerializer, JobSeekerDetailSerializer,
    CompanyRegisterSerializer, CompanyLoginSerializer, CompanyDetailSerializer,
    GoogleLoginSerializer, GoogleLoginResponseSerializer,
    ChoicesSerializer, PasswordResetRequestSerializer,
    PasswordResetTokenSerializer, PasswordResetConfirmSerializer
)
from .services.otp_service import (
    send_job_seeker_otp,
    verify_job_seeker_otp,
    verify_company_otp,
    send_company_otp,
)





import requests
from jobs.services.company_auth_service import get_or_create_company_token


logger = logging.getLogger(__name__)


class CustomPasswordResetTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        updated_at = getattr(user, 'updated_at', None) or ''
        last_login = getattr(user, 'last_login', None) or ''
        return str(user.pk) + str(user.password) + str(updated_at) + str(last_login) + str(timestamp)


custom_token_generator = CustomPasswordResetTokenGenerator()


def home(request):
    """Welcome endpoint to verify API is running"""
    return JsonResponse({"message": "Job Portal API is working 🚀"})


@api_view(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def api_404_handler(request):
    """
    Custom 404 handler for API routes.
    Returns JSON response instead of HTML.
    """
    return Response(
        {
            'error': 'API endpoint not found',
            'message': 'The requested API endpoint does not exist. Please check the URL and try again.',
            'status_code': 404,
            'available_endpoints': {
                'utility': [
                    'GET /api/ - API home',
                    'GET /api/choices/ - Get dropdown choices'
                ],
                'job_seeker_auth': [
                    'POST /api/auth/job-seeker/register/ - Register job seeker',
                    'POST /api/auth/job-seeker/verify-otp/ - Verify OTP and complete registration',
                    'POST /api/auth/job-seeker/login/ - Login job seeker'
                ],
                'company_auth': [
                    'POST /api/auth/company/register/ - Register company',
                    'POST /api/auth/company/verify-otp/ - Verify company OTP and complete registration',
                    'POST /api/auth/company/login/ - Login company'
                ]
            }
        },
        status=status.HTTP_404_NOT_FOUND
    )



@api_view(['GET'])
def get_choices(request):
    """
    Endpoint to get all dropdown choices.
    Used by frontend to populate dropdown selects.
    
    Returns:
        - governorates: List of available governorates
        - company_types: List of available company types
    """
    serializer = ChoicesSerializer({})
    return Response(serializer.data, status=status.HTTP_200_OK)



def get_user_by_email(email):
    email = email.strip().lower()
    user = JobSeeker.objects.filter(email__iexact=email).first()
    if user:
        return 'job_seeker', user

    user = Company.objects.filter(email__iexact=email).first()
    if user:
        return 'company', user

    custom_user = get_user_model().objects.filter(email__iexact=email).first()
    if custom_user:
        return 'customuser', custom_user

    return None, None


def get_user_from_uid(uidb64):
    try:
        decoded = force_str(urlsafe_base64_decode(uidb64))
        user_type, raw_pk = decoded.split(':', 1)
    except Exception:
        return None, None

    model_map = {
        'job_seeker': JobSeeker,
        'company': Company,
        'customuser': get_user_model(),
    }
    model = model_map.get(user_type)
    if not model:
        return None, None

    try:
        return user_type, model.objects.get(pk=raw_pk)
    except model.DoesNotExist:
        return None, None


def build_password_reset_link(user_type, user, token):
    uid = urlsafe_base64_encode(force_bytes(f"{user_type}:{user.pk}"))
    frontend_url = getattr(settings,'FRONTEND_URL','http://localhost:3000').rstrip('/')
    return f"{frontend_url}/reset-password/{uid}/{token}"


def send_password_reset_email(user_type, user, token):
    reset_link = build_password_reset_link(user_type, user, token)
    subject = 'Reset your password'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@jobportal.local')
    text_content = (
        'We received a request to reset your password.\n\n'
        f'Click the link below to reset your password:\n{reset_link}\n\n'
        'If you did not request a password reset, you can ignore this message.\n'
        'For security reasons, this link expires after 24 hours.'
    )
    html_content = (
        f'<p>We received a request to reset your password.</p>'
        f'<p><a href="{reset_link}">Reset your password</a></p>'
        '<p>If you did not request a password reset, you can ignore this message.</p>'
        '<p>For security reasons, this link expires after 24 hours.</p>'
    )

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_content,
        )
    except Exception as exc:
        logger.error(f"[send_password_reset_email] Unable to send reset email to {user.email}: {exc}")


@api_view(['POST'])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    user_type, user = get_user_by_email(email)

    if user:
        token = custom_token_generator.make_token(user)
        send_password_reset_email(user_type, user, token)

    return Response(
        {
            'message': 'If an account with that email exists, a password reset link has been sent.'
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def password_reset_validate(request):
    serializer = PasswordResetTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user_type, user = get_user_from_uid(serializer.validated_data['uidb64'])

    if user and custom_token_generator.check_token(user, serializer.validated_data['token']):
        return Response({'valid': True}, status=status.HTTP_200_OK)

    return Response(
        {
            'valid': False,
            'error': 'invalid_or_expired_token',
            'message': 'This reset link is invalid or has expired.'
        },
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user_type, user = get_user_from_uid(serializer.validated_data['uidb64'])

    if not user or not custom_token_generator.check_token(user, serializer.validated_data['token']):
        return Response(
            {
                'error': 'invalid_or_expired_token',
                'message': 'This reset link is invalid or has expired.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    new_password = serializer.validated_data['new_password']
    if user_type == 'customuser':
        user.set_password(new_password)
    else:
        user.password = make_password(new_password)
    user.save()

    return Response(
        {'message': 'Password has been reset successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def job_seeker_register(request):
    EmailVerification.cleanup_expired()
    serializer = JobSeekerOTPRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower().strip()

    return send_job_seeker_otp(email, serializer.validated_data)

@api_view(['POST'])
def verify_otp(request):
    """Endpoint to verify email OTP and create the account."""
    serializer = VerifyOTPSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        logger.debug('OTP verification validation errors: %s', exc.detail)
        print('OTP verification validation errors:', exc.detail)
        raise

    email = serializer.validated_data['email'].lower()
    otp = serializer.validated_data['otp']

    return verify_job_seeker_otp(email, otp)


@api_view(['POST'])
def company_verify_otp(request):
    """Endpoint to verify company registration OTP only."""
    serializer = VerifyOTPSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        logger.debug('Company OTP verification validation errors: %s', exc.detail)
        raise

    email = serializer.validated_data['email'].lower()
    otp = serializer.validated_data['otp']

    return verify_company_otp(email, otp)


@api_view(['POST'])
def login_user(request):
    email = request.data.get('email', '').lower().strip()
    password = request.data.get('password', '')

    # البحث أولاً في JobSeeker
    job_seeker = JobSeeker.objects.filter(email__iexact=email).first()

    if job_seeker:
        if check_password(password, job_seeker.password):
            detail_serializer = JobSeekerDetailSerializer(job_seeker)

            return Response(
                {
                    'message': 'Login successful',
                    'user_type': 'job_seeker',
                    'token': get_or_create_job_seeker_token(job_seeker),
                    'data': detail_serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # البحث في Company
    company = Company.objects.filter(email__iexact=email).first()

    if company:

        if not check_password(password, company.password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if company.approval_status == 'pending_admin_approval':
            return Response(
                {'error': 'Your company account is under review'},
                status=status.HTTP_403_FORBIDDEN
            )

        if company.approval_status == 'rejected':
            return Response(
                {'error': 'Your company account has been rejected'},
                status=status.HTTP_403_FORBIDDEN
            )

        detail_serializer = CompanyDetailSerializer(company)

        return Response(
            {
                'message': 'Login successful',
                'user_type': 'company',
                'token': get_or_create_company_token(company),
                'data': detail_serializer.data
            },
            status=status.HTTP_200_OK
        )
    # البحث عن Admin
    admin = AdminUser.objects.filter(email__iexact=email).first()

    if admin:
        if not admin.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not admin.is_active:
            return Response(
                {'error': 'This admin account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )

        token, _ = AdminAuthToken.objects.get_or_create(admin=admin)

        return Response(
            {
                'message': 'Login successful',
                'user_type': 'admin',
                'token': token.key,
                'data': {
                    'id': admin.id,
                    'full_name': admin.full_name,
                    'email': admin.email
                }
            },
            status=status.HTTP_200_OK
        )
    return Response(
        {'error': 'Invalid email or password'},
        status=status.HTTP_404_NOT_FOUND
    )



@api_view(['POST'])
def company_register(request):
    EmailVerification.cleanup_expired()
    serializer = CompanyRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    validated_data = serializer.validated_data
    email = validated_data['email'].lower().strip()

    return send_company_otp(email, validated_data)


def get_google_client_id():
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    if client_id:
        return client_id

    google_provider = getattr(settings, 'SOCIALACCOUNT_PROVIDERS', {}).get('google', {})
    google_app = google_provider.get('APP', {})
    return google_app.get('client_id') or google_app.get('CLIENT_ID')


def verify_google_id_token(id_token):
    if not id_token or not isinstance(id_token, str):
        raise ValueError('Invalid Google ID token.')

    try:
        response = requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': id_token},
            timeout=5,
        )
        response.raise_for_status()
        token_info = response.json()
    except requests.RequestException as exc:
        logger.warning('Google token verification failed: %s', exc)
        raise ValueError('Invalid Google token.')

    if not token_info.get('email'):
        raise ValueError('Google token did not contain an email address.')

    if token_info.get('email_verified') not in ('true', True):
        raise ValueError('Google account email is not verified.')

    client_id = get_google_client_id()
    if not client_id:
        logger.error('Google login attempted without a configured GOOGLE_CLIENT_ID.')
        raise ValueError('Google login is not configured correctly.')

    if token_info.get('aud') != client_id:
        raise ValueError('Google token audience does not match the configured client ID.')

    return token_info



@api_view(['POST'])
def google_login(request):
    """Endpoint for Google login using an ID token without creating new user accounts."""
    serializer = GoogleLoginSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        logger.debug('Google login validation errors: %s', exc.detail)
        raise

    try:
        token_info = verify_google_id_token(serializer.validated_data['id_token'])
    except ValueError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST
        )

    email = token_info['email'].lower().strip()
    job_seeker = JobSeeker.objects.filter(email__iexact=email).first()
    company = None if job_seeker else Company.objects.filter(email__iexact=email).first()

    if not job_seeker and not company:
        return Response(
            {'error': 'User not found. Please create an account first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if job_seeker:
        detail_serializer = JobSeekerDetailSerializer(job_seeker)
        return Response(
            {
                'message': 'Login successful',
                'user_type': 'job_seeker',
                'token': get_or_create_job_seeker_token(job_seeker),
                'data': detail_serializer.data,
            },
            status=status.HTTP_200_OK
        )

    # company
    if company.approval_status == 'pending_admin_approval':
        return Response(
            {'error': 'Your company account is under review'},
            status=status.HTTP_403_FORBIDDEN
        )

    if company.approval_status == 'rejected':
        return Response(
            {'error': 'Your company account has been rejected'},
            status=status.HTTP_403_FORBIDDEN
        )

    detail_serializer = CompanyDetailSerializer(company)
    return Response(
        {
            'message': 'Login successful',
            'user_type': 'company',
            'token': get_or_create_company_token(company),
            'data': detail_serializer.data,
        },
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
def company_login(request):
    """
    Endpoint for Company Login.
    
    Required fields:
        - email: str
        - password: str
    
    Returns:
        - Success (200): Company details, token for jobs API, and session info
        - Error (400): Invalid credentials
        - Error (404): Company not found
    """
    serializer = CompanyLoginSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        logger.debug('Company login validation errors: %s', exc.detail)
        raise

    email = serializer.validated_data.get('email', '').lower().strip()
    password = serializer.validated_data.get('password', '')

    try:
        company = Company.objects.get(email=email)
        
        # Verify password
        if check_password(password, company.password):
            
            if company.approval_status == 'pending_admin_approval':
                return Response(
                    {'error': 'Your company account is under review'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if company.approval_status == 'rejected':
                return Response(
                    {'error': 'Your company account has been rejected'},
                    status=status.HTTP_403_FORBIDDEN
                )

            detail_serializer = CompanyDetailSerializer(company)
            return Response(
                {
                    'message': 'Login successful',
                    'user_type': 'company',
                    'token': get_or_create_company_token(company),
                    'data': detail_serializer.data
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Company.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_404_NOT_FOUND
        )

class JobSeekerCountView(APIView):
    def get(self, request):
        count = JobSeeker.objects.count()
        return Response({"count": count})