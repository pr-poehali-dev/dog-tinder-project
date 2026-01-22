"""Email utilities for sending verification codes."""
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def is_email_enabled() -> bool:
    """Check if email sending is configured."""
    return bool(os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'))


def generate_code() -> str:
    """Generate 6-digit verification code using cryptographically secure random."""
    return str(secrets.randbelow(900000) + 100000)


def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Send email via SMTP (Gmail by default)."""
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    print(f"[EMAIL] Попытка отправки на {to_email}")
    print(f"[EMAIL] SMTP_USER: {smtp_user[:5]}*** (скрыто)")
    print(f"[EMAIL] SMTP_PASSWORD: {'установлен' if smtp_password else 'НЕ УСТАНОВЛЕН'}")

    if not smtp_user or not smtp_password:
        print("[EMAIL] ОШИБКА: SMTP_USER или SMTP_PASSWORD не установлены")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to_email

    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        print(f"[EMAIL] Подключение к {smtp_host}:{smtp_port}")
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            print("[EMAIL] TLS включен")
            server.login(smtp_user, smtp_password)
            print("[EMAIL] Авторизация успешна")
            server.sendmail(smtp_from, to_email, msg.as_string())
            print("[EMAIL] ✅ Письмо отправлено успешно")
        return True
    except smtplib.SMTPException as e:
        print(f"[EMAIL] ❌ SMTP ошибка: {str(e)}")
        return False
    except OSError as e:
        print(f"[EMAIL] ❌ Сетевая ошибка: {str(e)}")
        return False


def send_verification_code(to_email: str, code: str) -> bool:
    """Send email verification code."""
    subject = "Код подтверждения"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Подтверждение email</h2>
        <p>Ваш код подтверждения:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                  background: #f5f5f5; padding: 20px; text-align: center;
                  border-radius: 8px; margin: 20px 0;">
            {code}
        </p>
        <p style="color: #666; font-size: 14px;">
            Код действителен 24 часа. Если вы не регистрировались — проигнорируйте это письмо.
        </p>
    </div>
    """

    text_body = f"Ваш код подтверждения: {code}"

    return send_email(to_email, subject, html_body, text_body)


def send_password_reset_code(to_email: str, code: str) -> bool:
    """Send password reset code."""
    subject = "Код для сброса пароля"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сброс пароля</h2>
        <p>Ваш код для сброса пароля:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                  background: #f5f5f5; padding: 20px; text-align: center;
                  border-radius: 8px; margin: 20px 0;">
            {code}
        </p>
        <p style="color: #666; font-size: 14px;">
            Код действителен 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.
        </p>
    </div>
    """

    text_body = f"Ваш код для сброса пароля: {code}"

    return send_email(to_email, subject, html_body, text_body)