from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.hashers import make_password
import logging
from django.contrib import messages
from .models import JobSeeker, Company, EmailVerification
from .email_utils import (
    send_company_approval_email,
    send_company_rejection_email,
    send_company_deactivation_email,
    send_company_welcome_back_email,
    send_company_deletion_email,
)
from .utils import (
    send_jobseeker_deleted_email,  # 👈 تم إضافة استيراد دالة حذف حساب الباحث
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# EmailVerification actions (pending companies)
# ──────────────────────────────────────────────

@admin.action(description="Approve and create company account")
def approve_pending_company(modeladmin, request, queryset):
    created_count = 0

    for verification in queryset:
        payload = verification.payload or {}

        if payload.get('approval_status') != 'pending_admin_approval':
            continue

        # منع إنشاء شركة بنفس الإيميل إذا كانت موجودة ومفعّلة
        if Company.objects.filter(
            email__iexact=verification.email
        ).exclude(approval_status='rejected').exists():
            modeladmin.message_user(
                request,
                f"Skipped {verification.email}: an active company with this email already exists.",
                level='warning',
            )
            continue

        try:
            company = Company.objects.create(
                company_name=payload.get('company_name'),
                email=verification.email,
                phone_number=payload.get('phone_number'),
                password=payload.get('password_hash') or make_password(payload.get('password', '')),
                governorate=payload.get('governorate'),
                company_type=payload.get('company_type'),
                website_url=payload.get('website_url', '') or '',
                description=payload.get('description'),
                approval_status='approved',
                approval_email_sent=True,   # نضع True قبل الإرسال لمنع التكرار
            )

            send_company_approval_email(company)
            verification.delete()
            created_count += 1

        except Exception as e:
            logger.error(
                f"Failed to create company from EmailVerification {verification.email}: {e}"
            )

    modeladmin.message_user(
        request,
        f"Successfully created {created_count} company account(s)."
    )


@admin.action(description="Reject pending company registration")
def reject_pending_company(modeladmin, request, queryset):
    count = 0

    for verification in queryset:
        payload = verification.payload or {}

        if payload.get('approval_status') != 'pending_admin_approval':
            continue

        # إذا كان قد رُفض سابقاً لا نرسل إيميل مرة ثانية
        if payload.get('rejection_email_sent'):
            continue

        class TempCompany:
            pass

        temp = TempCompany()
        temp.company_name = payload.get('company_name', '')
        temp.email = verification.email
        temp.rejection_reason = None

        send_company_rejection_email(temp)

        # تحديث الحالة بدلاً من حذف السجل
        payload['approval_status'] = 'rejected'
        payload['rejection_email_sent'] = True
        verification.payload = payload
        verification.save()

        count += 1

    modeladmin.message_user(
        request,
        f"Rejected {count} pending company registration(s)."
    )

# ──────────────────────────────────────────────
# Company model actions (approved companies)
# ──────────────────────────────────────────────

@admin.action(description="Approve selected companies")
def approve_companies(modeladmin, request, queryset):
    for company in queryset:
        if company.approval_status == 'approved':
            continue
        original_status = company.approval_status

        company.approval_status = 'approved'
        company.is_active = True
        company.approval_email_sent = True
        company.rejection_email_sent = False            
        company.save()
        if original_status == 'rejected':
            send_company_welcome_back_email(company)
        else:
            send_company_approval_email(company)
 
@admin.action(description="Reject selected companies")
def reject_companies(modeladmin, request, queryset):
    for company in queryset:
        if company.approval_status == 'rejected':
            continue

        original_status = company.approval_status

        company.approval_status = 'rejected'
        company.is_active = False
        company.rejection_email_sent = False
        company.approval_email_sent = False  
        company.save()

        if original_status == 'approved':
            send_company_deactivation_email(company)
        else:
            send_company_rejection_email(company)
# ──────────────────────────────────────────────
# Admin registrations
# ──────────────────────────────────────────────
from django import forms

class EmailVerificationAdminForm(forms.ModelForm):
    APPROVAL_CHOICES = [
        ('', '---------'),
        ('pending_admin_approval', 'Pending Admin Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    approval_status = forms.ChoiceField(
        choices=APPROVAL_CHOICES,
        required=False,
        label="Company Status"
    )

    class Meta:
        model = EmailVerification
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            payload = self.instance.payload or {}
            self.fields['approval_status'].initial = payload.get('approval_status', '')

    def save(self, commit=True):
        instance = super().save(commit=False)
        payload = instance.payload or {}
        new_status = self.cleaned_data.get('approval_status', '')
        if new_status:
            payload['approval_status'] = new_status
        elif 'approval_status' in payload:
            del payload['approval_status']
        instance.payload = payload
        if commit:
            instance.save()
        return instance
    
@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    form = EmailVerificationAdminForm
    actions = [approve_pending_company, reject_pending_company]
    
    # 🟢 تم تعديل الأسماء هنا لاستدعاء دوال العرض الآمنة بالأسفل وتجنب خطأ الـ System Check
    list_display = ['email', 'user_type', 'approval_status_display', 'created_at', 'expires_at_display', 'is_expired_display']
    list_filter = ['user_type', 'created_at'] # ✂️ تم إزالة expires_at من الفلتر لأنه ليس حقلاً حقيقياً بقاعدة البيانات
    search_fields = ['email']
    readonly_fields = [
        'email',
        'user_type',
        'approval_status_display',
        'company_name_display',
        'phone_number_display',
        'governorate_display',
        'company_type_display',
        'website_display',
        'description_display',
        'seeker_full_name_display',
        'seeker_phone_display',
        'password_display',
        'created_at',
        'expires_at_display', # 🟢 تم التعديل هنا ليعمل كحقل قراءة فقط مخصص
    ]

    # ❌ لا يوجد fieldsets هنا — get_fieldsets بتتولى الأمر

    def get_fieldsets(self, request, obj=None):
        base = [
            ('Email Information', {
                'fields': ('email', 'user_type')
            }),
            ('Timing', {
                'fields': ('created_at', 'expires_at_display'), # 🟢 تم التعديل هنا
                'classes': ('collapse',)
            }),
        ]

        if obj and obj.user_type == 'job_seeker':
            base.insert(1, ('Job Seeker Information', {
                'fields': (
                    'seeker_full_name_display',
                    'seeker_phone_display',
                    'password_display',
                )
            }))
        else:
            base.insert(1, ('Company Information', {
                'fields': (
                    'company_name_display',
                    'phone_number_display',
                    'governorate_display',
                    'company_type_display',
                    'website_display',
                    'description_display',
                    'password_display',
                )
            }))
            base.append(('Status', {
                'fields': ('approval_status', 'approval_status_display')
            }))

        return base
    

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            return

        # 1. جلب الحالة القديمة قبل الحفظ من قاعدة البيانات
        try:
            original = EmailVerification.objects.get(pk=obj.pk)
            original_payload = original.payload or {}
            original_status = original_payload.get('approval_status')
        except EmailVerification.DoesNotExist:
            super().save_model(request, obj, form, change)
            return

        # 2. جلب الحالة الجديدة التي اختارها الآدمن من الفورم
        new_payload = obj.payload or {}
        new_status = new_payload.get('approval_status')

        # 3. التحقق إذا صار تحويل الحالة إلى Approved يدوياً
        if original_status != 'approved' and new_status == 'approved':
            if Company.objects.filter(
                email__iexact=obj.email
            ).exclude(approval_status='rejected').exists():
                messages.warning(
                    request,
                    f"Skipped {obj.email}: an active company with this email already exists."
                )
                return

            try:
                company = Company.objects.create(
                    company_name=new_payload.get('company_name'),
                    email=obj.email,
                    phone_number=new_payload.get('phone_number'),
                    password=new_payload.get('password_hash') or make_password(new_payload.get('password', '')),
                    governorate=new_payload.get('governorate'),
                    company_type=new_payload.get('company_type'),
                    website_url=new_payload.get('website_url', '') or '',
                    description=new_payload.get('description'),
                    approval_status='approved',
                    approval_email_sent=True,
                )
                send_company_approval_email(company)
                obj.delete()  # نحذف سجل الـ verification زي ما بيصير بالـ bulk action
                messages.success(request, f"Company account created for {obj.email}.")
            except Exception as e:
                logger.error(f"Failed to create company from EmailVerification {obj.email}: {e}")
                messages.error(request, f"Failed to create company: {e}")
            return  # مهم: منوقف هون لأن obj تم حذفه، منكمل الحفظ العادي تحت

        # 4. حفظ التعديل الأساسي في قاعدة البيانات أولاً
        super().save_model(request, obj, form, change)

        # 5. التحقق وإرسال إيميل الرفض إذا تغيرت الحالة إلى Rejected يدوياً
        if original_status != 'rejected' and new_status == 'rejected':
            if not new_payload.get('rejection_email_sent'):
                class TempCompany:
                    pass
                temp = TempCompany()
                temp.company_name = new_payload.get('company_name', '')
                temp.email = obj.email
                temp.rejection_reason = None

                try:
                    send_company_rejection_email(temp)
                    new_payload['rejection_email_sent'] = True
                    obj.payload = new_payload
                    EmailVerification.objects.filter(pk=obj.pk).update(payload=new_payload)
                except Exception as e:
                    logger.error(f"Failed to send rejection email via form save for {obj.email}: {e}")
    def message_user(self, request, message, level=messages.INFO, extra_tags='', fail_silently=False):
        # نلغي رسالة "changed successfully" الافتراضية من Django
        if "was changed successfully" in str(message):
            return
        super().message_user(request, message, level, extra_tags, fail_silently)
    # 🟢 دالة لعرض وقت الانتهاء من الـ payload بأمان دون قفل السيرفر
    def expires_at_display(self, obj):
        payload = obj.payload or {}
        return payload.get('expires_at') or "-"
    expires_at_display.short_description = "Expires At"

    # 🟢 دالة لعرض حالة انتهاء الصلاحية بأمان
    def is_expired_display(self, obj):
        # إذا كانت الدالة موجودة في الموديل استدعها، وإلا أظهر حالة افتراضية
        if hasattr(obj, 'is_expired'):
            return "Yes" if callable(obj.is_expired) and obj.is_expired() else "No"
        return "No"
    is_expired_display.short_description = "Is Expired"
    
    def password_display(self, obj):
        payload = obj.payload or {}
        return payload.get('password_hash') or payload.get('password') or '-'
    password_display.short_description = "Password (hashed)"

    
    def seeker_full_name_display(self, obj):
        return (obj.payload or {}).get('full_name', '-') or '-'
    seeker_full_name_display.short_description = "Full Name"

    def seeker_phone_display(self, obj):
        return (obj.payload or {}).get('phone_number', '-') or '-'
    seeker_phone_display.short_description = "Phone Number"

    def company_name_display(self, obj):
        return (obj.payload or {}).get('company_name', '-') or '-'
    company_name_display.short_description = "Company Name"

    def phone_number_display(self, obj):
        return (obj.payload or {}).get('phone_number', '-')
    phone_number_display.short_description = "Phone Number"

    def governorate_display(self, obj):
        return (obj.payload or {}).get('governorate', '-')
    governorate_display.short_description = "Governorate"

    def company_type_display(self, obj):
        return (obj.payload or {}).get('company_type', '-')
    company_type_display.short_description = "Company Type"

    def website_display(self, obj):
        return (obj.payload or {}).get('website_url', '-')
    website_display.short_description = "Website"

    def description_display(self, obj):
        return (obj.payload or {}).get('description', '-')
    description_display.short_description = "Description"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return True

    def approval_status_display(self, obj):
        payload = obj.payload or {}
        s = payload.get('approval_status')

        if s == 'pending_admin_approval':
            return format_html("<span style='color:orange'>⏳ Pending Admin Approval</span>")
        elif s == 'rejected':
            return format_html("<span style='color:red'>❌ Rejected</span>")
        return "-"
    approval_status_display.short_description = "Company Status"

@admin.register(JobSeeker)
class JobSeekerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone_number', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['full_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at', 'password']

    fieldsets = (
        ('Personal Information', {'fields': ('full_name', 'email', 'phone_number')}),
        ('Security', {'fields': ('password',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    # 🟢 إرسال البريد عند الحذف الفردي للباحث عن عمل
    def delete_model(self, request, obj):
        try:
            send_jobseeker_deleted_email(obj)
        except Exception as e:
            logger.error(f"Failed to send deletion email to job seeker {obj.email}: {e}")
        obj.delete()

    # 🟢 إرسال البريد عند الحذف الجماعي (Bulk Delete) للباحثين عن عمل
    def delete_queryset(self, request, queryset):
        for seeker in queryset:
            try:
                send_jobseeker_deleted_email(seeker)
            except Exception as e:
                logger.error(f"Failed to send bulk deletion email to job seeker {seeker.email}: {e}")
        queryset.delete()


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        'company_name', 'email', 'status_badge',
        'governorate', 'approval_status',
        'company_type', 'created_at',
    ]
    list_filter = ['is_active', 'governorate', 'company_type', 'approval_status']
    search_fields = ['company_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at', 'password','approval_email_sent', 'rejection_email_sent','is_active']
    actions = [approve_companies, reject_companies]

    def status_badge(self, obj):
        if obj.approval_status == 'approved':
            return format_html("<span style='color:green'>✅ Approved</span>")
        elif obj.approval_status == 'rejected':
            return format_html("<span style='color:red'>❌ Rejected</span>")
        return format_html("<span style='color:orange'>⏳ Pending</span>")

    status_badge.short_description = "Status"

    def delete_model(self, request, obj):
        send_company_deletion_email(obj)
        obj.delete()

    def delete_queryset(self, request, queryset):
        for company in queryset:
            send_company_deletion_email(company)
        queryset.delete()

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            return

        try:
            original = Company.objects.get(pk=obj.pk)
        except Company.DoesNotExist:
            super().save_model(request, obj, form, change)
            return

        original_status = original.approval_status
        new_status = obj.approval_status
        if new_status == 'approved':
            obj.approval_email_sent = True
            obj.rejection_email_sent = False
            obj.is_active = True
        elif new_status == 'rejected':
            obj.approval_email_sent = False
            obj.rejection_email_sent = True
            obj.is_active = False
        else:
           
            obj.approval_email_sent = False
            obj.rejection_email_sent = False
            obj.is_active = False 
        super().save_model(request, obj, form, change)


    
        if original_status != 'approved' and new_status == 'approved':
            if original_status == 'rejected':
                send_company_welcome_back_email(obj)
            else:
                send_company_approval_email(obj)
       
        elif original_status != 'rejected' and new_status == 'rejected':

                if original_status == 'approved':
                    send_company_deactivation_email(obj)
                else:
                    send_company_rejection_email(obj)

    fieldsets = (
        ('Company Information', {'fields': ('company_name', 'email', 'phone_number')}),
        ('Location & Business Type', {'fields': ('governorate', 'company_type')}),
        ('Company Details', {'fields': ('website_url', 'description')}),
        ('Security', {'fields': ('password',)}),
        ('Status', {'fields': ('is_active', 'approval_status', 'rejection_email_sent', 'approval_email_sent', 'rejection_reason')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
