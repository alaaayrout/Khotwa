import secrets

from django.db import models

from users.models import Company


def generate_company_token():
    return secrets.token_hex(32)


class CompanyAuthToken(models.Model):

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='job_auth_tokens',
    )
    key = models.CharField(max_length=64, unique=True, default=generate_company_token)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Company Auth Token'
        verbose_name_plural = 'Company Auth Tokens'

    def __str__(self):
        return f'Token for {self.company.company_name}'
