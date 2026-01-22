import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import time

def handler(event: dict, context) -> dict:
    """API для авторизации через email с кодом подтверждения"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'send_code':
            return send_verification_code(body)
        elif action == 'verify_code':
            return verify_code(body)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }


def send_verification_code(body: dict) -> dict:
    """Отправка кода подтверждения на email"""
    
    email = body.get('email', '').strip().lower()
    
    if not email or '@' not in email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid email'})
        }
    
    code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email
    msg['Subject'] = 'Ваш код подтверждения TinDog'
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Добро пожаловать в TinDog!</h2>
        <p>Ваш код подтверждения:</p>
        <h1 style="color: #FF6B6B; letter-spacing: 5px;">{code}</h1>
        <p>Код действителен в течение 10 минут.</p>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        server = smtplib.SMTP_SSL(smtp_host, 465)
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'code': code,
                'expires_at': int(time.time()) + 600
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to send email: {str(e)}'})
        }


def verify_code(body: dict) -> dict:
    """Проверка кода подтверждения"""
    
    email = body.get('email', '').strip().lower()
    code = body.get('code', '').strip()
    expected_code = body.get('expected_code', '').strip()
    expires_at = body.get('expires_at', 0)
    
    if int(time.time()) > expires_at:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Code expired'})
        }
    
    if code != expected_code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid code'})
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'email': email,
            'authenticated': True
        })
    }
