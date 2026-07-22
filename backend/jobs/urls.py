"""
توجيه URLs لتطبيق jobs — كل ميزة في ملف منفصل.
"""

from django.urls import path, include

urlpatterns = [
    # ── عرض عام للوظائف (للمستخدمين) ──────────────────────
    path('', include('jobs.routes.public_job_urls')),

    # ── القوائم الثابتة (مدن، دوام، طريقة عمل...) ─────────
    path('choices/', include('jobs.routes.choices_urls')),

    # ── إدارة التخصصات ─────────────────────────────────────
    path('specializations/', include('jobs.routes.specialization_urls')),

    # ── إدارة وظائف الشركة ─────────────────────────────────
    path('company/jobs/', include('jobs.routes.company_job_urls')),
]
