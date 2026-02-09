'''API для Telegram-авторизации: получение username бота и проверка статуса авторизации'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
import datetime

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
            'body': '',
            'isBase64Encoded': False
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
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_bot_username() -> dict:
    bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', '')
    
    if not bot_username:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot username not configured'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'bot_username': bot_username}),
        'isBase64Encoded': False
    }

def check_auth_status(data: dict) -> dict:
    '''Проверяет статус авторизации по session_id'''
    session_id = data.get('session_id', '').replace("'", "''")
    
    if not session_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authenticated': False, 'error': 'session_id required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем сессию
        cur.execute(
            f"SELECT s.user_id, s.authenticated, u.id, u.email, u.username, u.name, u.avatar_url, u.telegram_id FROM t_p11971418_dog_tinder_project.telegram_auth_sessions s JOIN t_p11971418_dog_tinder_project.users u ON s.user_id = u.id WHERE s.session_id = '{session_id}' AND s.expires_at > NOW()"
        )
        session = cur.fetchone()
        
        if not session or not session['authenticated']:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'authenticated': False}),
                'isBase64Encoded': False
            }
        
        # Генерируем JWT токены
        jwt_secret = os.environ.get('JWT_SECRET', 'secret')
        
        access_token_payload = {
            'user_id': session['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }
        refresh_token_payload = {
            'user_id': session['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }
        
        access_token = jwt.encode(access_token_payload, jwt_secret, algorithm='HS256')
        refresh_token = jwt.encode(refresh_token_payload, jwt_secret, algorithm='HS256')
        
        user_data = {
            'id': session['id'],
            'email': session['email'],
            'username': session['username'],
            'name': session['name'],
            'avatar_url': session['avatar_url'],
            'telegram_id': session['telegram_id']
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'authenticated': True,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 900,
                'user': user_data
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authenticated': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
