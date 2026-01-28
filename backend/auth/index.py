'''API для email-аутентификации: вход по коду или паролю с выбором username'''

import json
import os
import random
import string
import time
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'POST')
    
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
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'send_code':
            return send_verification_code(body)
        elif action == 'verify_code':
            return verify_code_and_register(body)
        elif action == 'check_username':
            return check_username_availability(body)
        elif action == 'generate_username':
            return generate_unique_username(body)
        elif action == 'set_username':
            return set_username(body)
        elif action == 'register':
            return register_with_password(body)
        elif action == 'login':
            return login_with_password(body)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def send_verification_code(body: dict) -> dict:
    email = body.get('email', '').strip().lower()
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email обязателен'})
        }
    
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = int(time.time()) + 600
    
    print(f'Verification code for {email}: {code}')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'code': code,
            'expires_at': expires_at
        })
    }

def verify_code_and_register(body: dict) -> dict:
    email = body.get('email', '').strip().lower()
    code = body.get('code', '').strip()
    expected_code = body.get('expected_code', '')
    expires_at = body.get('expires_at', 0)
    username = body.get('username', '').strip()
    
    if not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username обязателен'})
        }
    
    if int(time.time()) > expires_at:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Код истёк'})
        }
    
    if code != expected_code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный код'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        username_escaped = username.replace("'", "''")
        cur.execute(
            f"SELECT id, email, username FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER('{username_escaped}')"
        )
        existing_username = cur.fetchone()
        
        if existing_username:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username уже занят'})
            }
        
        email_escaped = email.replace("'", "''")
        cur.execute(
            f"SELECT id, email, username FROM t_p11971418_dog_tinder_project.users WHERE email = '{email_escaped}'"
        )
        user = cur.fetchone()
        
        if user:
            if user['username']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'authenticated': True,
                        'user': dict(user)
                    })
                }
            else:
                cur.execute(
                    f"UPDATE t_p11971418_dog_tinder_project.users SET username = '{username_escaped}', username_updated_at = NOW(), email_verified = true WHERE id = {user['id']} RETURNING id, email, username, name, avatar_url, username_updated_at"
                )
                updated_user = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                user_dict = dict(updated_user)
                if user_dict.get('username_updated_at'):
                    user_dict['username_updated_at'] = user_dict['username_updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'authenticated': True,
                        'user': user_dict
                    })
                }
        else:
            cur.execute(
                f"INSERT INTO t_p11971418_dog_tinder_project.users (email, username, email_verified, username_updated_at) VALUES ('{email_escaped}', '{username_escaped}', true, NOW()) RETURNING id, email, username, name, avatar_url, username_updated_at"
            )
            new_user = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            user_dict = dict(new_user)
            if user_dict.get('username_updated_at'):
                user_dict['username_updated_at'] = user_dict['username_updated_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'authenticated': True,
                    'user': user_dict
                })
            }
    except Exception as e:
        cur.close()
        conn.close()
        raise e

def check_username_availability(body: dict) -> dict:
    username = body.get('username', '').strip()
    
    if not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username обязателен'})
        }
    
    if len(username) < 3:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'available': False, 'message': 'Минимум 3 символа'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        username_escaped = username.replace("'", "''")
        cur.execute(
            f"SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER('{username_escaped}')"
        )
        exists = cur.fetchone()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'available': not exists,
                'message': 'Username свободен' if not exists else 'Username занят'
            })
        }
    finally:
        cur.close()
        conn.close()

def generate_unique_username(body: dict) -> dict:
    email = body.get('email', '').strip().lower()
    
    base = email.split('@')[0] if email else 'user'
    base = ''.join(c for c in base if c.isalnum())[:10]
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        for _ in range(10):
            suffix = ''.join(random.choices(string.digits, k=4))
            username = f"{base}{suffix}"
            username_escaped = username.replace("'", "''")
            
            cur.execute(
                f"SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER('{username_escaped}')"
            )
            
            if not cur.fetchone():
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'username': username})
                }
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не удалось сгенерировать username'})
        }
    finally:
        cur.close()
        conn.close()

def set_username(body: dict) -> dict:
    user_id = body.get('user_id')
    new_username = body.get('username', '').strip().lower()
    
    if not user_id or not new_username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id и username обязательны'})
        }
    
    if len(new_username) < 3 or len(new_username) > 30:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username должен быть от 3 до 30 символов'})
        }
    
    if not new_username.replace('_', '').isalnum():
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username может содержать только буквы, цифры и _'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute(
            f"SELECT username, username_updated_at FROM t_p11971418_dog_tinder_project.users WHERE id = {user_id}"
        )
        user_data = cur.fetchone()
        
        if not user_data:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'})
            }
        
        current_username = user_data['username']
        username_updated_at = user_data['username_updated_at']
        
        if current_username and username_updated_at:
            import datetime
            now = datetime.datetime.now()
            days_since_update = (now - username_updated_at).days
            
            if days_since_update < 30:
                days_remaining = 30 - days_since_update
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Изменить username можно через {days_remaining} дн.'})
                }
        
        new_username_escaped = new_username.replace("'", "''")
        cur.execute(
            f"SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER('{new_username_escaped}') AND id != {user_id}"
        )
        
        if cur.fetchone():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username уже занят'})
            }
        
        cur.execute(
            f"UPDATE t_p11971418_dog_tinder_project.users SET username = '{new_username_escaped}', username_updated_at = NOW() WHERE id = {user_id} RETURNING id, email, username, name, avatar_url, username_updated_at"
        )
        updated_user = cur.fetchone()
        conn.commit()
        
        user_dict = dict(updated_user)
        if user_dict.get('username_updated_at'):
            user_dict['username_updated_at'] = user_dict['username_updated_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': user_dict
            })
        }
    finally:
        cur.close()
        conn.close()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def register_with_password(body: dict) -> dict:
    email = body.get('email', '').strip().lower()
    password = body.get('password', '').strip()
    username = body.get('username', '').strip()
    
    if not email or not password or not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email, пароль и username обязательны'})
        }
    
    if len(password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        email_escaped = email.replace("'", "''")
        cur.execute(
            f"SELECT id FROM t_p11971418_dog_tinder_project.users WHERE email = '{email_escaped}'"
        )
        existing_user = cur.fetchone()
        
        if existing_user:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь уже существует'})
            }
        
        username_escaped = username.replace("'", "''")
        cur.execute(
            f"SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER('{username_escaped}')"
        )
        existing_username = cur.fetchone()
        
        if existing_username:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username уже занят'})
            }
        
        password_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO t_p11971418_dog_tinder_project.users (email, username, password_hash, email_verified, username_updated_at) VALUES ('{email_escaped}', '{username_escaped}', '{password_hash}', true, NOW()) RETURNING id, email, username, name, avatar_url"
        )
        new_user = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'authenticated': True,
                'user': dict(new_user)
            })
        }
    finally:
        cur.close()
        conn.close()

def login_with_password(body: dict) -> dict:
    email = body.get('email', '').strip().lower()
    password = body.get('password', '').strip()
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email и пароль обязательны'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        password_hash = hash_password(password)
        email_escaped = email.replace("'", "''")
        cur.execute(
            f"SELECT id, email, username, name, avatar_url FROM t_p11971418_dog_tinder_project.users WHERE email = '{email_escaped}' AND password_hash = '{password_hash}'"
        )
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'authenticated': True,
                'user': dict(user)
            })
        }
    finally:
        cur.close()
        conn.close()
