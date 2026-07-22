from allauth.account.signals import user_signed_up
from django.dispatch import receiver
from .models import JobSeeker

@receiver(user_signed_up)
def create_job_seeker(request, user, **kwargs):
    print("🔥 SIGNAL WORKED")

    if not JobSeeker.objects.filter(email=user.email).exists():
        JobSeeker.objects.create(
            email=user.email,
            full_name=user.username or ""
        )