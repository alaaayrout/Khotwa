
import os
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
import secrets
from users.models import JobSeeker
import hashlib


def generate_gravatar_url(email):
    """يولّد رابط Gravatar بناءً على الإيميل."""
    email_hash = hashlib.md5(email.strip().lower().encode('utf-8')).hexdigest()
    return f"https://www.gravatar.com/avatar/{email_hash}?d=identicon&s=200"

def validate_cv_file(file):
    # نفس منطق الفرونت: PDF فقط + أقصى حجم 5MB
    ext = os.path.splitext(file.name)[1].lower()
    if ext != ".pdf":
        raise ValidationError("cv_invalid_type")
    if file.size > 5 * 1024 * 1024:
        raise ValidationError("cv_too_large")

def validate_profile_picture(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png"):
        raise ValidationError("picture_invalid_type")
    if file.size > 2* 1024 * 1024:  
        raise ValidationError("picture_too_large")

def cv_upload_path(instance, filename):
    return f"cvs/seeker_{instance.profile.user_id}/{filename}"


class SeekerProfile(models.Model):
    user = models.OneToOneField(
        JobSeeker,
        on_delete=models.CASCADE,
        related_name="seeker_profile",
    )
    governorate = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    cv_file = models.FileField(
        upload_to="cvs_upload_path",
        blank=True,
        null=True,
        validators=[validate_cv_file],
    )
    profile_picture = models.ImageField(
     upload_to="profile_pictures/",
     blank=True,
     null=True,
     validators=[validate_profile_picture],
)
    external_picture_url = models.URLField(
     max_length=500,
     blank=True,
     null=True,
    
)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"

    @property
    def completion_percentage(self):
        fields = [
            self.user.full_name,
            self.user.email,
            self.user.phone_number,
            self.governorate,
            self.bio,
            self.cv_file,
        ]
        filled = sum(1 for f in fields if f)
        filled += 1 if self.skills.exists() else 0
        filled += 1 if self.experiences.exists() else 0
        filled += 1 if self.education_entries.exists() else 0
        total = len(fields) + 3
        return round((filled / total) * 100)


class Skill(models.Model):
    profile = models.ForeignKey(SeekerProfile, on_delete=models.CASCADE, related_name="skills")
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ("profile", "name")

    def __str__(self):
        return self.name


class Experience(models.Model):
    profile = models.ForeignKey(SeekerProfile, on_delete=models.CASCADE, related_name="experiences")
    title = models.CharField(max_length=150)
    company = models.CharField(max_length=150)
    date_from = models.CharField(max_length=7)   # "YYYY-MM" متل input type=month بالفرونت
    date_to = models.CharField(max_length=7, blank=True, null=True)
    current = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_from"]


class Education(models.Model):
    profile = models.ForeignKey(SeekerProfile, on_delete=models.CASCADE, related_name="education_entries")
    degree = models.CharField(max_length=150)
    institution = models.CharField(max_length=150)
    year = models.PositiveIntegerField()

    class Meta:
        ordering = ["-year"]

def generate_job_seeker_token():
    return secrets.token_hex(32)


class JobSeekerAuthToken(models.Model):
    """
    رمز مصادقة لطالبي العمل — بنفس نمط CompanyAuthToken.
    """
    job_seeker = models.ForeignKey(
        JobSeeker,
        on_delete=models.CASCADE,
        related_name='auth_tokens',
    )
    key = models.CharField(max_length=64, unique=True, default=generate_job_seeker_token)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Job Seeker Auth Token'
        verbose_name_plural = 'Job Seeker Auth Tokens'

    def __str__(self):
        return f'Token for {self.job_seeker.full_name}'
    

