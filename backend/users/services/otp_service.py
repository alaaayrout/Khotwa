import logging
import secrets
import hashlib
from datetime import timedelta
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.core.mail import get_connection
from rest_framework.response import Response
from rest_framework import status
from seeker_profiles.models import SeekerProfile, generate_gravatar_url  
from ..models import EmailVerification, JobSeeker, Company

logger = logging.getLogger(__name__)


def generate_otp():
    if getattr(settings, 'DEBUG', False):
        return '123456'
    return '{:06d}'.format(secrets.randbelow(1000000))


def hash_otp(otp: str) -> str:
    """Hash OTP using SHA-256."""
    return hashlib.sha256(otp.encode()).hexdigest()


def send_verification_email(email, otp):
    subject = 'Verify your email address'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@jobportal.local')

    text_content = f"\nYour verification code is: {otp}\nThis code expires in 10 minutes.\n"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:500px; margin:auto; background:white; padding:20px; border-radius:10px;">
            <h2 style="color:#333;">Email Verification</h2>
            <p>Use the code below to verify your account:</p>
            <div style="font-size:24px; letter-spacing:5px; font-weight:bold; background:#f0f0f0; padding:10px; text-align:center; border-radius:8px; margin:20px 0;">
                {otp}
            </div>
            <p style="color:#777;">This code will expire in <b>10 minutes</b>.</p>
            <p style="color:#999; font-size:12px;">If you didn't request this code, you can ignore this email.</p>
        </div>
    </div>
    """
    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except SMTPException as e:
        logger.error(f"Email sending failed: {str(e)}")
        if getattr(settings, 'DEBUG', False):
            logger.warning("SMTP failed in DEBUG mode. Continuing without failing the registration flow.")
            return None
        raise
    except Exception as e:
        logger.error(f"Unexpected email error: {str(e)}")
        if getattr(settings, 'DEBUG', False):
            logger.warning("Unexpected email error in DEBUG mode. Continuing without failing the registration flow.")
            return None
        raise


def get_or_clean_verification(email, now):
    """Fetches the verification record and cleans it up if expired (24h window)."""
    verification = EmailVerification.objects.filter(email__iexact=email).first()
    if verification:
        if verification.request_expires_at and now >= verification.request_expires_at:
            verification.delete()
            return None
    return verification


def email_exists(email):
    """Helper method (Best Practice) to handle clean global check across global account types."""
    return (
        JobSeeker.objects.filter(email__iexact=email).exists() or
        Company.objects.filter(email__iexact=email).exists()
    )


def _apply_rate_limiting(existing_verification, rate_limit_meta, now):
    """Shared rate limiting logic secured against None or corrupted payload states."""
    payload = existing_verification.payload or {}
    # تأمين وتحديث الـ Dict بشكل صريح لمنع حدوث أي Desynchronization في الذاكرة
    meta = payload.get('_otp_metadata') or {}
    payload['_otp_metadata'] = meta

    first_request_at = meta.get('first_request_at')
    last_request_at = meta.get('last_request_at')
    request_count = meta.get('request_count', 0)

    elapsed_since_last = now.timestamp() - (last_request_at or 0)
    elapsed_since_first = now.timestamp() - (first_request_at or 0)

    if last_request_at and elapsed_since_last < 60:
        return payload, Response({"otp_error": "otp_error_wait"}, status=status.HTTP_400_BAD_REQUEST)

    if first_request_at and elapsed_since_first <= 600 and request_count >= 5:
        return payload, Response({"otp_error": "otp_error_limit"}, status=status.HTTP_400_BAD_REQUEST)

    window_reset = not first_request_at or elapsed_since_first > 600
    rate_limit_meta['request_count'] = 1 if window_reset else request_count + 1
    rate_limit_meta['first_request_at'] = now.timestamp() if window_reset else first_request_at
    rate_limit_meta['last_request_at'] = now.timestamp()
    payload['_otp_metadata'] = rate_limit_meta

    return payload, None


# ==========================================
# 🧠 CORE SHARED LOGIC LAYERS
# ==========================================

def _base_send_otp(email, validated_data, user_type, check_data_changed_fn, payload_builder_fn):
    """Core reusable service for sending/resending OTP codes."""
    now = timezone.now()
    rate_limit_meta = {
        'request_count': 1,
        'first_request_at': now.timestamp(),
        'last_request_at': now.timestamp(),
    }

    existing_verification = get_or_clean_verification(email, now)

    if existing_verification:
        payload = existing_verification.payload or {}
        current_user_type = existing_verification.user_type

        if current_user_type == user_type:
            if check_data_changed_fn(payload, validated_data):
                return Response(
                    {
                        "error_code": "cannot_change_pending_data",
                        "message": (
                            "You cannot change your company data right now." if user_type == 'company' else
                            "You cannot change your data right now. Wait 24 hours or use the same data."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if current_user_type == 'company' and payload.get('approval_status') == 'pending_admin_approval':
            return Response(
                {"error_code": "company_pending_approval", "message": "Your company registration request is already under review."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_user_type != user_type:
            opposing_type = "company" if user_type == "job_seeker" else "job seeker"
            return Response(
                {"error_code": "email_pending_verification", "message": f"This email already has a pending {opposing_type} verification request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payload, error = _apply_rate_limiting(existing_verification, rate_limit_meta, now)
        if error:
            if error.data.get("otp_error") == "otp_error_wait":
                error.data["message"] = "الرجاء الانتظار دقيقة واحدة بين طلبات الـ OTP."
            elif error.data.get("otp_error") == "otp_error_limit":
                error.data["message"] = "لقد تجاوزت حد إعادة الإرسال (5 مرات كل 10 دقائق). يرجى المحاولة لاحقاً."
            return error

    else:
  
         payload = payload_builder_fn(validated_data, rate_limit_meta)

    otp = generate_otp()
    otp_hash = hash_otp(otp)
    otp_expires_at = now + timedelta(minutes=10)
    request_expires_at = now + timedelta(hours=24)

    EmailVerification.objects.update_or_create(
        email=email,
        defaults={
            'otp_hash': otp_hash,
            'payload': payload,
            'otp_expires_at': otp_expires_at,
            'request_expires_at': request_expires_at,
            'user_type': user_type,
        }
    )

    send_verification_email(email, otp)
    return Response({'message': 'Verification code sent to your email'}, status=status.HTTP_200_OK)


def _base_verify_otp(email, otp, expected_user_type, specific_verification_logic_fn):
    """Core reusable service for verifying OTP codes."""
    now = timezone.now()
    verification = get_or_clean_verification(email, now)
    
    if not verification:
        return Response({"error": "otp_invalid"}, status=status.HTTP_400_BAD_REQUEST)

    if verification.request_expires_at and now > verification.request_expires_at:
        verification.delete()
        return Response({'error': 'Verification request expired (24 hours window passed)'}, status=status.HTTP_400_BAD_REQUEST)

    if not verification.otp_expires_at or now > verification.otp_expires_at:
        return Response({'error': 'Verification code expired'}, status=status.HTTP_400_BAD_REQUEST)

    if verification.otp_hash != hash_otp(otp):
        return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)

    if expected_user_type == 'company' and verification.user_type != 'company':
        return Response({'error': 'Invalid company verification request'}, status=status.HTTP_400_BAD_REQUEST)

    return specific_verification_logic_fn(verification, email)


# ==========================================
# 👤 JOB SEEKER INTERFACES
# ==========================================

def send_job_seeker_otp(email, validated_data):
    if email_exists(email):
        return Response(
            {"error_code": "email_already_registered", "message": "This email is already registered."},
            status=status.HTTP_400_BAD_REQUEST
        )

    def check_changed(payload, validated):
        return (payload.get('full_name') != validated['full_name'] or 
                payload.get('phone_number') != validated['phone_number'])

    def build_payload(validated, meta):
        # الحسم الأمني: تشفير الباسورد فوراً عند الاستلام لحماية الـ DB والـ Logs من أي تسريب صريح
        return {
            'full_name': validated['full_name'],
            'phone_number': validated['phone_number'],
            'password_hash': make_password(validated['password']),
            '_otp_metadata': meta,
        }

    return _base_send_otp(email, validated_data, 'job_seeker', check_changed, build_payload)


def verify_job_seeker_otp(email, otp):
    if email_exists(email):
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    return _base_verify_otp(email, otp, 'job_seeker', handle_job_seeker_otp_verification)


def handle_job_seeker_otp_verification(verification, email):
    payload = verification.payload or {}
    password_hash = payload.get('password_hash')

    if not password_hash:
        return Response({"error": "missing_credentials_in_payload"}, status=status.HTTP_400_BAD_REQUEST)

    if email_exists(email):
        verification.delete()
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # الحساب يُنشأ مباشرة بالـ Hash المتوافق مع معايير الأمان والهندسة الداخلية لـ Django
    job_seeker = JobSeeker.objects.create(
        full_name=payload['full_name'],
        email=email,
        phone_number=payload['phone_number'],
        password=password_hash,
    )
    SeekerProfile.objects.create(
        user=job_seeker,
        external_picture_url=generate_gravatar_url(email),
    )
    verification.delete()

    return Response({'message': 'Email verified and account created successfully'}, status=status.HTTP_201_CREATED)

    
# ==========================================
# 🏢 COMPANY INTERFACES
# ==========================================

def send_company_otp(email, validated_data):
    existing_company = Company.objects.filter(email__iexact=email).first()
    if existing_company and existing_company.approval_status not in ('rejected',):
        return Response(
            {"error_code": "email_already_registered", "message": "This email is already registered."},
            status=status.HTTP_400_BAD_REQUEST
        )

    def check_changed(payload, validated):
        return (
            payload.get('company_name') != validated['company_name'] or
            payload.get('phone_number') != validated['phone_number'] or
            payload.get('governorate') != validated['governorate'] or
            payload.get('company_type') != validated['company_type'] or
            payload.get('website_url', '') != (validated.get('website_url') or '') or
            payload.get('description') != validated['description']
        )

    def build_payload(validated, meta):
        # حماية الـ credentials للشركة بتشفيرها الفوري قبل الدخول لقاعدة البيانات
        return {
            'company_name': validated['company_name'],
            'phone_number': validated['phone_number'],
            'password_hash': make_password(validated['password']),
            'governorate': validated['governorate'],
            'company_type': validated['company_type'],
            'website_url': validated.get('website_url') or "",
            'description': validated['description'],
            '_otp_metadata': meta,
        }

    return _base_send_otp(email, validated_data, 'company', check_changed, build_payload)


def verify_company_otp(email, otp):
    existing_company = Company.objects.filter(email__iexact=email).first()
    if existing_company and existing_company.approval_status != 'rejected':
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    return _base_verify_otp(email, otp, 'company', handle_company_otp_verification)


def handle_company_otp_verification(verification, email):
    payload = verification.payload or {}
    password_hash = payload.get('password_hash')

    existing_company = Company.objects.filter(email__iexact=email).first()
    if existing_company and existing_company.approval_status != 'rejected':
        verification.delete()
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    if existing_company:
        existing_company.delete()

    if email_exists(email):
        verification.delete()
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    if not password_hash:
        return Response({"error": "missing_credentials_in_payload"}, status=status.HTTP_400_BAD_REQUEST)

    company = Company.objects.create(
        company_name=payload['company_name'],
        email=email,
        phone_number=payload['phone_number'],
        password=password_hash,
        governorate=payload['governorate'],
        company_type=payload['company_type'],
        website_url=payload.get('website_url') or "",
        description=payload['description'],
        approval_status='pending_admin_approval',
    )
    verification.delete()

    return Response(
        {
            'message': 'Email verified. Your company account is pending admin approval',
            'user_type': 'company',
            'approval_status': company.approval_status,
        },
        status=status.HTTP_200_OK
    )