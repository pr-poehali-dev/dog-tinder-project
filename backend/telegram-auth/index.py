'''API для Telegram-авторизации: получение username бота и обработка callback'''

import json
import os
import hashlib
import hmac
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import parse_qs

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
        elif action == 'callback':
            body = json.loads(event.get('body', '{}'))
            return handle_telegram_callback(body)
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

def handle_telegram_callback(data: dict) -> dict:
    telegram_id = data.get('id')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    username = data.get('username', '')
    photo_url = data.get('photo_url', '')
    auth_date = data.get('auth_date')
    hash_value = data.get('hash', '')
    
    if not telegram_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid Telegram data'})
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'})
        }
    
    data_check_items = []
    for key in sorted(data.keys()):
        if key != 'hash':
            data_check_items.append(f'{key}={data[key]}')
    data_check_string = '\n'.join(data_check_items)
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    if calculated_hash != hash_value:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid hash'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        telegram_id_escaped = str(telegram_id).replace("'", "''")
        cur.execute(
            f"SELECT id, email, username, name, avatar_url, telegram_id FROM t_p11971418_dog_tinder_project.users WHERE telegram_id = '{telegram_id_escaped}'"
        )
        user = cur.fetchone()
        
        display_name = first_name
        if last_name:
            display_name += f' {last_name}'
        
        if user:
            cur.execute(
                f"UPDATE t_p11971418_dog_tinder_project.users SET name = '{display_name.replace(chr(39), chr(39)+chr(39))}', avatar_url = '{photo_url.replace(chr(39), chr(39)+chr(39))}' WHERE id = {user['id']} RETURNING id, email, username, name, avatar_url, telegram_id"
            )
            updated_user = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'authenticated': True,
                    'user': dict(updated_user)
                })
            }
        else:
            generated_username = username if username else f'user{telegram_id}'
            
            cur.execute(
                f"INSERT INTO t_p11971418_dog_tinder_project.users (telegram_id, username, name, avatar_url) VALUES ('{telegram_id_escaped}', '{generated_username.replace(chr(39), chr(39)+chr(39))}', '{display_name.replace(chr(39), chr(39)+chr(39))}', '{photo_url.replace(chr(39), chr(39)+chr(39))}') RETURNING id, email, username, name, avatar_url, telegram_id"
            )
            new_user = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'authenticated': True,
                    'user': dict(new_user)
                })
            }
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
