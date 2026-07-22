from django.db import models


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    job_seeker = models.ForeignKey(
        'users.JobSeeker',
        on_delete=models.CASCADE,
        related_name='job_applications',
    )
    job_posting = models.ForeignKey(
        'jobs.JobPosting',
        on_delete=models.CASCADE,
        related_name='job_applications',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    cover_letter = models.TextField(blank=True, default='')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job_seeker', 'job_posting')
        ordering = ['-applied_at']

    def __str__(self):
        return f'{self.job_seeker.full_name} -> {self.job_posting.title}'
