from django.db import models

from users.models import Company
from ..constants import (
    SYRIAN_CITY_CHOICES,
    EMPLOYMENT_TYPE_CHOICES,
    WORK_MODE_CHOICES,
    JOB_STATUS_CHOICES,
)
from .specialization import Specialization


class JobPosting(models.Model):
    """فرصة عمل تنشرها شركة معتمدة."""

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='job_postings',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    specialization = models.ForeignKey(
        Specialization,
        on_delete=models.PROTECT,
        related_name='job_postings',
    )
    city = models.CharField(max_length=50, choices=SYRIAN_CITY_CHOICES)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    work_mode = models.CharField(max_length=20, choices=WORK_MODE_CHOICES)
    required_skills = models.JSONField(default=list, blank=True, help_text='المهارات المطلوبة للوظيفة - JSON array')

    # إعدادات النشر
    status = models.CharField(max_length=10, choices=JOB_STATUS_CHOICES, default='draft')
    expires_at = models.DateField(help_text='تاريخ انتهاء مدة الوظيفة — إجباري')
    is_active = models.BooleanField(default=True)
    views_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Job Posting'
        verbose_name_plural = 'Job Postings'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.company.company_name}'
