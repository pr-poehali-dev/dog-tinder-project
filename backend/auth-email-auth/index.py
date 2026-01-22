import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import time
import psycopg2
from psycopg2.extras import RealDictCursor

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
    
    user = get_or_create_user(email)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': user,
            'authenticated': True
        })
    }


def get_or_create_user(email: str) -> dict:
    """Получить или создать пользователя в базе данных"""
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, email, name, phone, city, about, avatar_url, created_at FROM t_p11971418_dog_tinder_project.users WHERE email = %s",
                (email,)
            )
            user = cur.fetchone()
            
            if user:
                cur.execute(
                    "UPDATE t_p11971418_dog_tinder_project.users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                conn.commit()
                user_dict = dict(user)
                if user_dict.get('created_at'):
                    user_dict['created_at'] = user_dict['created_at'].isoformat()
                return user_dict
            
            cur.execute(
                "INSERT INTO t_p11971418_dog_tinder_project.users (email, password_hash, email_verified) VALUES (%s, %s, %s) RETURNING id, email, name, phone, city, about, avatar_url, created_at",
                (email, '', True)
            )
            new_user = cur.fetchone()
            conn.commit()
            user_dict = dict(new_user)
            if user_dict.get('created_at'):
                user_dict['created_at'] = user_dict['created_at'].isoformat()
            return user_dict
    finally:
        conn.close()