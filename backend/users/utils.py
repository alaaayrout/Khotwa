import logging
import hashlib
import random
import string

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


# =========================
# OTP HELPERS
# =========================

def generate_otp(length=6):
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def hash_otp(otp: str) -> str:
    """Return a SHA-256 hash of the OTP."""
    return hashlib.sha256(otp.encode()).hexdigest()


# =========================
# SEND OTP EMAIL
# =========================

def send_otp_email(pending_registration, request=None):
    """
    Generates an OTP, stores its hash on the EmailVerification record,
    and emails it to the user. Returns True on success, False on failure.
    """
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    expires_at = timezone.now() + timedelta(minutes=10)

    # Update the existing EmailVerification record
    pending_registration.otp_hash = otp_hash
    pending_registration.expires_at = expires_at
    pending_registration.save(update_fields=['otp_hash', 'expires_at'])

    try:
        send_mail(
            subject='Job Portal - verification code',
            message=(
                f'Your OTP verification code is: {otp}\n\n'
                f'This code expires in 10 minutes.\n\n'
                f'If you did not request this, please ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[pending_registration.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"[send_otp_email] Failed to send email to {pending_registration.email}: {e}")
        return False


def send_company_approval_email(company):
    """Notify company that their account has been approved."""
    subject = 'Your company account has been approved'
    message = (
        f'Hello {company.company_name},\n\n'
        'Your company account has been approved. You can now log in using your registered email address.\n\n'
        'If you need assistance, please contact support.'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"[send_company_approval_email] Failed to send email to {company.email}: {e}")
        raise

def send_company_rejection_email(company):
    """Notify company that their account registration was rejected."""
    subject = 'Your company registration request was rejected'
    if company.rejection_reason:
        message = (
            f'Hello {company.company_name},\n\n'
            'We are sorry to inform you that your company registration request has been rejected.\n\n'
            f'Reason: {company.rejection_reason}\n\n'
            'If you have questions, please contact support for more information.'
        )
    else:
        message = (
            f'Hello {company.company_name},\n\n'
            'We are sorry to inform you that your company registration request has been rejected.\n\n'
            'If you have questions, please contact support for more information.'
        )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"[send_company_rejection_email] Failed to send email to {company.email}: {e}")

def send_jobseeker_created_email(user):
    send_mail(
        subject='Account created successfully',
        message=(
            'Your account has been created successfully.\n\n'
            'You can now log in and start applying for jobs.\n\n'
            'Welcome to the platform!'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_jobseeker_deleted_email(user):
    send_mail(
        subject='Account deleted',
        message=(
            'Your account has been deleted from our system.\n\n'
            'If this was a mistake, please contact support.'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


# =========================
# CUSTOM EXCEPTION HANDLER
# =========================

def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler referenced in settings.py under
    REST_FRAMEWORK['EXCEPTION_HANDLER'].
    """
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, ValidationError):
            logger.debug('DRF validation error: %s', response.data)
        return response

    if isinstance(exc, Http404):
        return Response(
            {
                'error': 'Route not found',
                'message': 'The requested endpoint does not exist.',
                'status_code': 404,
            },
            status=status.HTTP_404_NOT_FOUND
        )

    logger.exception('Unhandled exception: %s', exc)
    return Response(
        {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred. Please try again later.',
            'status_code': 500,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
def send_company_deactivation_email(company):
    """Notify company that their account has been deactivated."""
    subject = 'Your company account has been deactivated'
    message = (
        f'Hello {company.company_name},\n\n'
        'Your company account has been deactivated by the admin team.\n\n'
        'If you believe this is a mistake, please contact support.'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"[send_company_deactivation_email] Failed to send email to {company.email}: {e}")


def send_company_welcome_back_email(company):
    """Notify company that their account has been reactivated/re-approved."""
    subject = 'Welcome back! Your company account has been reactivated'
    message = (
        f'Hello {company.company_name},\n\n'
        'Good news! Your company account has been reactivated and approved again.\n\n'
        'You can now log in using your registered email address.'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"[send_company_welcome_back_email] Failed to send email to {company.email}: {e}")


def send_company_deletion_email(company):
    """Notify company that their account has been deleted."""
    subject = 'Your company account has been deleted'
    message = (
        f'Hello {company.company_name},\n\n'
        'Your company account has been deleted from our system.\n\n'
        'If this was a mistake, please contact support.'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"[send_company_deletion_email] Failed to send email to {company.email}: {e}")
