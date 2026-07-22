"""
Email utility functions for company notifications.
Handles approval, rejection, and deactivation emails.
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_company_approval_email(company):
    """
    Send approval email to company when admin approves their registration.
    
    Args:
        company: Company object that was approved
    """
    subject = 'Company Account Approved'
    
    text_content = f"""
Hello {company.company_name},

Great news! Your company account has been approved.

You can now log in using your registered email address and start posting job opportunities on our platform.

We look forward to your participation!

Best regards,
Job Portal Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
            
            <h2 style="color:#2ecc71;">✓ Account Approved</h2>
            
            <p>Hello <strong>{company.company_name}</strong>,</p>
            
            <p>Great news! Your company account has been <strong>approved</strong>.</p>
            
            <p style="line-height:1.6;">
                You can now log in using your registered email address and start posting job opportunities 
                on our platform. Our team is ready to help you find the right candidates for your positions.
            </p>
            
            <div style="background:#f0f0f0; padding:15px; border-radius:8px; margin:20px 0;">
                <p style="margin:0;"><strong>Company Email:</strong> {company.email}</p>
                <p style="margin:10px 0 0 0;"><strong>Status:</strong> <span style="color:#2ecc71;">Active</span></p>
            </div>
            
            <p style="margin-top:20px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="color:#666; font-size:12px; margin-top:30px; border-top:1px solid #ddd; padding-top:15px;">
                Best regards,<br>
                <strong>Job Portal Team</strong>
            </p>

        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [company.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"[send_company_approval_email] Approval email sent to {company.email}")
        return True
    except Exception as e:
        logger.error(f"[send_company_approval_email] Failed to send approval email to {company.email}: {e}")
        return False


def send_company_rejection_email(company):
    """
    Send rejection email to company when admin rejects their registration before approval.
    
    Args:
        company: Company object that was rejected
    """
    subject = 'Your Company Registration Request Was Rejected'
    
    rejection_reason = company.rejection_reason or "No specific reason provided."
    
    text_content = f"""
Hello {company.company_name},

Thank you for your interest in joining our job portal platform. After reviewing your company registration, 
we regret to inform you that your registration request has been rejected.

Reason: {rejection_reason}

If you believe this is in error or would like to reapply with updated information, 
please feel free to contact our support team or register again.

Best regards,
Job Portal Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
            
            <h2 style="color:#e74c3c;">Registration Request Not Approved</h2>
            
            <p>Hello <strong>{company.company_name}</strong>,</p>
            
            <p>Thank you for your interest in joining our job portal platform.</p>
            
            <p style="line-height:1.6;">
                After reviewing your company registration, we regret to inform you that 
                your registration request has been <strong>rejected</strong>.
            </p>
            
            <div style="background:#fff3cd; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #ffc107;">
                <p style="margin:0;"><strong>Reason:</strong></p>
                <p style="margin:5px 0 0 0; color:#333;">{rejection_reason}</p>
            </div>
            
            <p style="margin-top:20px;">
                If you believe this is in error or would like to reapply with updated information, 
                please feel free to:
            </p>
            <ul style="line-height:1.8;">
                <li>Contact our support team for clarification</li>
                <li>Register again with updated or corrected information</li>
            </ul>
            
            <p style="color:#666; font-size:12px; margin-top:30px; border-top:1px solid #ddd; padding-top:15px;">
                Best regards,<br>
                <strong>Job Portal Team</strong>
            </p>

        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [company.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"[send_company_rejection_email] Rejection email sent to {company.email}")
        return True
    except Exception as e:
        logger.error(f"[send_company_rejection_email] Failed to send rejection email to {company.email}: {e}")
        return False


def send_company_deactivation_email(company):
    """
    Send deactivation email to company when their approved account is rejected/deactivated.
    
    Args:
        company: Company object that was deactivated
    """
    subject = 'Company Account Deactivated'
    
    text_content = f"""
Hello {company.company_name},

We regret to inform you that your company account on our job portal has been deactivated 
and access has been disabled effective immediately.

Your company will no longer be able to log in or post new job listings.

If you would like to discuss this decision or believe it was made in error, 
please contact our support team immediately.

Best regards,
Job Portal Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
            
            <h2 style="color:#e74c3c;">⚠ Account Deactivated</h2>
            
            <p>Hello <strong>{company.company_name}</strong>,</p>
            
            <p style="line-height:1.6;">
                We regret to inform you that your company account on our job portal has been 
                <strong>deactivated</strong> and access has been disabled effective immediately.
            </p>
            
            <div style="background:#ffe6e6; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #e74c3c;">
                <p style="margin:0;"><strong>Status:</strong> <span style="color:#e74c3c;">Deactivated</span></p>
                <p style="margin:10px 0 0 0;">Your company will no longer be able to log in or post job listings.</p>
            </div>
            
            <p style="margin-top:20px;">
                If you would like to discuss this decision or believe it was made in error, 
                please contact our support team immediately.
            </p>
            
            <p style="color:#666; font-size:12px; margin-top:30px; border-top:1px solid #ddd; padding-top:15px;">
                Best regards,<br>
                <strong>Job Portal Team</strong>
            </p>

        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [company.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"[send_company_deactivation_email] Deactivation email sent to {company.email}")
        return True
    except Exception as e:
        logger.error(f"[send_company_deactivation_email] Failed to send deactivation email to {company.email}: {e}")
        return False
def send_company_welcome_back_email(company):
    """
    Send welcome back email when a previously rejected company is approved again.
    """
    subject = 'Your Company Account Has Been Reinstated'

    text_content = f"""
Hello {company.company_name},

Welcome back! We're pleased to inform you that your company account has been reinstated and is now active again.

You can log in using your registered email address and resume posting job opportunities on our platform.

We're glad to have you back!

Best regards,
Job Portal Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">

            <h2 style="color:#2ecc71;">🎉 Welcome Back!</h2>

            <p>Hello <strong>{company.company_name}</strong>,</p>

            <p style="line-height:1.6;">
                We're pleased to inform you that your company account has been 
                <strong>reinstated</strong> and is now active again.
            </p>

            <div style="background:#f0fff4; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #2ecc71;">
                <p style="margin:0;"><strong>Company Email:</strong> {company.email}</p>
                <p style="margin:10px 0 0 0;"><strong>Status:</strong> <span style="color:#2ecc71;">Active ✓</span></p>
            </div>

            <p style="margin-top:20px;">
                You can now log in and resume posting job opportunities on our platform.
                We're glad to have you back!
            </p>

            <p style="color:#666; font-size:12px; margin-top:30px; border-top:1px solid #ddd; padding-top:15px;">
                Best regards,<br>
                <strong>Job Portal Team</strong>
            </p>

        </div>
    </div>
    """

    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [company.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"[send_company_welcome_back_email] Welcome back email sent to {company.email}")
        return True
    except Exception as e:
        logger.error(f"[send_company_welcome_back_email] Failed to send welcome back email to {company.email}: {e}")
        return False

def send_company_deletion_email(company):
    """
    Send deletion email when a company account is permanently deleted.
    """
    subject = 'Your Company Account Has Been Deleted'

    text_content = f"""
Hello {company.company_name},

We want to inform you that your company account on our job portal has been permanently deleted.

All your data and job listings have been removed from our platform.

If you believe this was done in error, please contact our support team as soon as possible.

Best regards,
Job Portal Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">

            <h2 style="color:#e74c3c;">🗑 Account Permanently Deleted</h2>

            <p>Hello <strong>{company.company_name}</strong>,</p>

            <p style="line-height:1.6;">
                We want to inform you that your company account on our job portal has been 
                <strong>permanently deleted</strong>.
            </p>

            <div style="background:#ffe6e6; padding:15px; border-radius:8px; margin:20px 0; border-left:4px solid #e74c3c;">
                <p style="margin:0;"><strong>Company Email:</strong> {company.email}</p>
                <p style="margin:10px 0 0 0;"><strong>Status:</strong> <span style="color:#e74c3c;">Deleted ✗</span></p>
            </div>

            <p style="margin-top:20px;">
                All your data and job listings have been removed from our platform.
                If you believe this was done in error, please contact our support team as soon as possible.
            </p>

            <p style="color:#666; font-size:12px; margin-top:30px; border-top:1px solid #ddd; padding-top:15px;">
                Best regards,<br>
                <strong>Job Portal Team</strong>
            </p>

        </div>
    </div>
    """

    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [company.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"[send_company_deletion_email] Deletion email sent to {company.email}")
        return True
    except Exception as e:
        logger.error(f"[send_company_deletion_email] Failed to send deletion email to {company.email}: {e}")
        return False