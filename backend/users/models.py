from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


ROLE_CHOICES = (
    ('job_seeker', 'Job Seeker'),
    ('company', 'Company'),
)



class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )


class EmailVerification(models.Model):
    """Stores a pending registration OTP and the associated registration payload."""
    email = models.EmailField()
    otp_hash = models.CharField(max_length=128)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    request_expires_at = models.DateTimeField(null=True, blank=True)
    user_type = models.CharField(
    max_length=20,
    choices=[
        ('job_seeker', 'Job Seeker'),
        ('company', 'Company')
    ],
    default='job_seeker'
    
)

    class Meta:
        verbose_name = "Email Verification"
        verbose_name_plural = "Email Verifications"
        ordering = ['-created_at']

    
    def is_otp_expired(self):
     if not self.otp_expires_at:
        return True
     return timezone.now() > self.otp_expires_at
    
    # ... الحقول القديمة داخل كلاس EmailVerification ...

    
    def is_expired(self):

        if self.request_expires_at:
            return timezone.now() > self.request_expires_at
        
        # fallback: إذا لم يُحسب وقت انتهاء الطلب سابقاً، احسبه من وقت الإنشاء + 24 ساعة
        if self.created_at:
            return timezone.now() > self.created_at + timezone.timedelta(hours=24)
            
        return False


    
    def is_request_expired(self):
     if not self.request_expires_at:
        return True
     return timezone.now() > self.request_expires_at
    
    
    
    @classmethod
    def cleanup_expired(cls):
     now = timezone.now()
     one_day_ago = now - timezone.timedelta(hours=24)
    
    # حذف ما انتهى تاريخ صلاحيته الصريح، أو ما مر على إنشائه 24 ساعة وحقله فارغ
     cls.objects.filter(
        models.Q(request_expires_at__lt=now) | 
        models.Q(request_expires_at__isnull=True, created_at__lt=one_day_ago)
    ).delete()
    

GOVERNORATE_CHOICES = [
    ('damascus', 'Damascus'),
    ('rural_damascus', 'Rural Damascus'),
    ('aleppo', 'Aleppo'),
    ('homs', 'Homs'),
    ('hama', 'Hama'),
    ('latakia', 'Latakia'),
    ('tartus', 'Tartus'),
    ('deir_ezzor', 'Deir Ezzor'),
    ('raqqa', 'Raqqa'),
    ('hasakah', 'Hasakah'),
    ('daraa', 'Daraa'),
    ('suwayda', 'Suwayda'),
    ('quneitra', 'Quneitra'),
    ('idlib', 'Idlib'),
]

COMPANY_TYPE_CHOICES = [
    ('programming', 'Programming'),
    ('civil', 'Civil'),
    ('healthcare', 'Healthcare'),
    ('education', 'Education'),
    ('finance', 'Finance'),
    ('marketing', 'Marketing'),
    ('hospitality', 'Hospitality'),
    ('other', 'Other'),
]



class JobSeeker(models.Model):
    """
    Model for job seekers who want to search for jobs.
    Stores personal information specific to job seekers.
    """


    
    # Basic Information
    full_name = models.CharField(
        max_length=150,
        help_text="Full name of the job seeker"
    )
    email = models.EmailField(
        unique=True,
        help_text="Email address for login and contact"
    )
    phone_regex = RegexValidator(
    regex=r'^\+\d{10,13}$',
    message="Phone must be like +963991234567"
)
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        help_text="Phone number for contact"
    )
    password = models.CharField(
        max_length=255,
        help_text="Password (will be hashed)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Job Seeker"
        verbose_name_plural = "Job Seekers"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"



class Company(models.Model):
    """
    Model for companies that post job opportunities.
    Stores company-specific information including location and business type.
    """

    approval_status = models.CharField(
       max_length=30,
       choices=[
        ('pending_admin_approval', 'Pending Admin Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ],
       default='pending_admin_approval',
)

    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection if the company registration was rejected"
    )

    # Basic Information
    company_name = models.CharField(
        max_length=200,
        help_text="Official company name"
    )
    email = models.EmailField(
        unique=True,
        help_text="Company email for login and contact"
    )

    phone_regex = RegexValidator(
    regex=r'^\+\d{10,13}$',
    message="Phone must be like +963991234567"
)

    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        help_text="Company phone number"
    )
    password = models.CharField(
        max_length=255,
        help_text="Password (will be hashed)"
    )
    
    # Location and Business Details
    governorate = models.CharField(
        max_length=50,
        choices=GOVERNORATE_CHOICES,
        help_text="Company location (governorate)"
    )
    company_type = models.CharField(
        max_length=50,
        choices=COMPANY_TYPE_CHOICES,
        help_text="Type of company industry"
    )
    def approve(self):
        self.approval_status = 'approved'
        self.save()   
    def reject(self):
        self.approval_status = 'rejected'
        self.save()  


    approval_email_sent = models.BooleanField(default=False)
    rejection_email_sent = models.BooleanField(default=False)
    
    # Company Description
    website_url = models.URLField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Company website link"
    )
    description = models.TextField(
        help_text="Description about the company"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.company_name} ({self.governorate})"
