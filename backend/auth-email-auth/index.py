import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import time
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import base64
import uuid

def handler(event: dict, context) -> dict:
    """API для авторизации через email, обновления профиля и загрузки аватара"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'send_code':
            return send_verification_code(body)
        elif action == 'verify_code':
            return verify_code(body)
        elif action == 'update_profile':
            return update_profile(body)
        elif action == 'upload_avatar':
            return upload_avatar(body)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
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
        }),
        'isBase64Encoded': False
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


def update_profile(body: dict) -> dict:
    """Обновление профиля пользователя"""
    
    user_id = body.get('user_id')
    name = body.get('name')
    city = body.get('city')
    avatar_url = body.get('avatar_url')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id is required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            update_fields = []
            update_values = []
            
            if name is not None:
                update_fields.append("name = %s")
                update_values.append(name)
            
            if city is not None:
                update_fields.append("city = %s")
                update_values.append(city)
            
            if avatar_url is not None:
                update_fields.append("avatar_url = %s")
                update_values.append(avatar_url)
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_values.append(user_id)
            
            query = f"UPDATE t_p11971418_dog_tinder_project.users SET {', '.join(update_fields)} WHERE id = %s RETURNING id, email, name, phone, city, about, avatar_url, created_at"
            
            cur.execute(query, update_values)
            updated_user = cur.fetchone()
            conn.commit()
            
            if not updated_user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            user_dict = dict(updated_user)
            if user_dict.get('created_at'):
                user_dict['created_at'] = user_dict['created_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': user_dict
                }),
                'isBase64Encoded': False
            }
    finally:
        conn.close()


def upload_avatar(body: dict) -> dict:
    """Загрузка аватара в S3"""
    
    image_base64 = body.get('image')
    
    if not image_base64:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Image data is required'}),
            'isBase64Encoded': False
        }
    
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    image_data = base64.b64decode(image_base64)
    
    file_name = f"avatars/{uuid.uuid4()}.jpg"
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    s3.put_object(
        Bucket='files',
        Key=file_name,
        Body=image_data,
        ContentType='image/jpeg'
    )
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_name}"
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'url': cdn_url
        }),
        'isBase64Encoded': False
    }