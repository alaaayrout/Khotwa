from smtplib import SMTPException
from unittest.mock import patch

from django.test import TestCase, override_settings

from .services.otp_service import send_verification_email


class EmailSendingFallbackTests(TestCase):
    @override_settings(DEBUG=True, EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend')
    @patch('users.services.otp_service.EmailMultiAlternatives.send', side_effect=SMTPException('auth failed'))
    def test_send_verification_email_does_not_raise_when_smtp_fails_in_debug(self, mock_send):
        send_verification_email('test@example.com', '123456')

        self.assertTrue(mock_send.called)
