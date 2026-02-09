'''API для Telegram-авторизации: получение username бота и проверка статуса авторизации'''

import json
import os
import psycopg2
import jwt
from datetime import datetime, timedelta

JWT_SECRET = os.environ.get('JWT_SECRET')
DATABASE_URL = os.environ.get('DATABASE_URL')

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action')
        
        if action == 'bot-username':
            return get_bot_username()
        elif action == 'check_auth':
            body = json.loads(event.get('body', '{}'))
            return check_auth_status(body)
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

def get_bot_username() -> dict:
    bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', '')
    
    if not bot_username:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot username not configured'})
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'bot_username': bot_username})
    }

def check_auth_status(data: dict) -> dict:
    """Проверка статуса авторизации по session_id"""
    session_id = data.get('session_id')
    
    if not session_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authenticated': False, 'error': 'session_id required'})
        }
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Проверяем сессию
        cur.execute(
            """SELECT user_id, telegram_id, authenticated 
               FROM telegram_auth_sessions 
               WHERE session_id = %s AND expires_at > NOW()""",
            (session_id,)
        )
        session = cur.fetchone()
        
        if not session or not session[2]:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'authenticated': False})
            }
        
        user_id, telegram_id, _ = session
        
        # Получаем данные пользователя
        cur.execute(
            "SELECT id, email, name, avatar_url, telegram_id FROM users WHERE id = %s",
            (user_id,)
        )
        user_row = cur.fetchone()
        
        if not user_row:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'authenticated': False})
            }
        
        user = {
            'id': user_row[0],
            'email': user_row[1],
            'name': user_row[2],
            'avatar_url': user_row[3],
            'telegram_id': str(user_row[4])
        }
        
        # Генерируем JWT токены
        access_payload = {
            'user_id': user['id'],
            'telegram_id': user['telegram_id'],
            'exp': datetime.utcnow() + timedelta(minutes=15)
        }
        refresh_payload = {
            'user_id': user['id'],
            'telegram_id': user['telegram_id'],
            'exp': datetime.utcnow() + timedelta(days=30)
        }
        
        access_token = jwt.encode(access_payload, JWT_SECRET, algorithm='HS256')
        refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm='HS256')
        
        # Удаляем использованную сессию
        cur.execute("DELETE FROM telegram_auth_sessions WHERE session_id = %s", (session_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'authenticated': True,
                'user': user,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 900
            })
        }
        
    except Exception as e:
        print(f'Error checking auth: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authenticated': False, 'error': str(e)})
        }
    finally:
        cur.close()
        conn.close()
