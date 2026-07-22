from django.db import models


class Specialization(models.Model):
    """التخصص — يُدار عبر API مستقل (إضافة / جلب / تعديل / حذف)."""

    name_ar = models.CharField(max_length=150, help_text='اسم التخصص بالعربية')
    name_en = models.CharField(max_length=150, help_text='اسم التخصص بالإنجليزية')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Specialization'
        verbose_name_plural = 'Specializations'
        ordering = ['name_ar']

    def __str__(self):
        return self.name_ar
