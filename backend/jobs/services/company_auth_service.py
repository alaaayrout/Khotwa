"""
إصدار رمز مصادقة الشركة — يُستدعى من company login في users.
"""

from ..models import CompanyAuthToken


def get_or_create_company_token(company):
    """إرجاع رمز مصادقة للشركة (إنشاء واحد جديد إن لم يوجد)."""
    token, _ = CompanyAuthToken.objects.get_or_create(company=company)
    return token.key
