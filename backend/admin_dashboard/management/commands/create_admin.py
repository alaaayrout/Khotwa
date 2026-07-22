import getpass

from django.core.management.base import BaseCommand, CommandError

from admin_dashboard.models import AdminAuthToken, AdminUser


class Command(BaseCommand):
    help = "إنشاء حساب أدمن جديد + توكن مصادقة له"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--full-name", required=True)

    def handle(self, *args, **options):
        email = options["email"]
        full_name = options["full_name"]

        if AdminUser.objects.filter(email=email).exists():
            raise CommandError(f"يوجد أدمن مسجل بهذا الإيميل أصلاً: {email}")

        password = getpass.getpass("كلمة السر: ")
        password_confirm = getpass.getpass("تأكيد كلمة السر: ")
        if password != password_confirm:
            raise CommandError("كلمتا السر غير متطابقتين")

        admin = AdminUser(email=email, full_name=full_name)
        admin.set_password(password)
        admin.save()

        token = AdminAuthToken.objects.create(admin=admin)

        self.stdout.write(self.style.SUCCESS(f"تم إنشاء الأدمن: {email}"))
        self.stdout.write(self.style.SUCCESS(f"التوكن: {token.key}"))
        self.stdout.write("استخدم هذا التوكن بال header: Authorization: Token <التوكن>")
