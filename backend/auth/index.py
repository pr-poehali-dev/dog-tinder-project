'''API для email-аутентификации с обязательным выбором username'''
import json
import os
import random
import string
import time
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
        cur.execute(
            "SELECT id, email, username FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER(%s)",
            (username,)
        )
        existing_username = cur.fetchone()
        
        if existing_username:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username уже занят'})
            }
        
        cur.execute(
            "SELECT id, email, username FROM t_p11971418_dog_tinder_project.users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        
        if user:
            if user['username']:
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
                    "UPDATE t_p11971418_dog_tinder_project.users SET username = %s, email_verified = true WHERE id = %s RETURNING id, email, username, name, avatar_url",
                    (username, user['id'])
                )
                updated_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'authenticated': True,
                        'user': dict(updated_user)
                    })
                }
        else:
            cur.execute(
                "INSERT INTO t_p11971418_dog_tinder_project.users (email, username, email_verified) VALUES (%s, %s, true) RETURNING id, email, username, name, avatar_url",
                (email, username)
            )
            new_user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'authenticated': True,
                    'user': dict(new_user)
                })
            }
    finally:
        cur.close()
        conn.close()

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
        cur.execute(
            "SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER(%s)",
            (username,)
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
            
            cur.execute(
                "SELECT id FROM t_p11971418_dog_tinder_project.users WHERE LOWER(username) = LOWER(%s)",
                (username,)
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
