'''Telegram Bot Webhook Handler - обработка команд бота и авторизация'''

import json
import time
import os
import requests
from urllib.parse import quote

def handler(event: dict, context) -> dict:
    '''Обработка webhook запросов от Telegram бота'''
    
    method = event.get('httpMethod', 'POST')
    
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
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Получаем данные сообщения
        message = body.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        text = message.get('text', '')
        user = message.get('from', {})
        
        if not chat_id:
            return success_response({'ok': True})
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        site_url = os.environ.get('SITE_URL', 'https://tindog.poehali.app')
        
        # Обработка команды /start с параметром авторизации
        if text.startswith('/start web_auth_'):
            session_id = text.replace('/start web_auth_', '').strip()
            
            # Сохраняем данные пользователя в БД для session_id
            save_auth_session(session_id, user)
            
            # Отправляем сообщение с кнопкой для авторизации
            telegram_id = user.get('id')
            first_name = user.get('first_name', 'пользователь')
            username = user.get('username', '')
            
            message_text = f"👋 Привет, {first_name}!\n\n✅ Авторизация на сайте TinDog успешна!\n\nТеперь можно вернуться в браузер."
            
            send_telegram_message(bot_token, chat_id, message_text)
            
            return success_response({'ok': True})
        
        # Обработка обычной команды /start
        elif text == '/start' or text.startswith('/start'):
            welcome_text = "🐕 Добро пожаловать в TinDog Bot!\n\nНажмите кнопку ниже, чтобы войти на сайт:"
            
            # Отправляем сообщение с кнопкой Web App
            keyboard = {
                'inline_keyboard': [[{
                    'text': '🚀 Войти на сайт',
                    'web_app': {'url': site_url}
                }]]
            }
            
            send_telegram_message_with_keyboard(bot_token, chat_id, welcome_text, keyboard)
            return success_response({'ok': True})
        
        return success_response({'ok': True})
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

def save_auth_session(session_id: str, user: dict):
    '''Сохраняет данные авторизации в базу данных'''
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        telegram_id = str(user.get('id', ''))
        first_name = user.get('first_name', '').replace("'", "''")
        last_name = user.get('last_name', '').replace("'", "''")
        username = user.get('username', '').replace("'", "''")
        
        session_id_escaped = session_id.replace("'", "''")
        
        # Проверяем, есть ли уже пользователь с таким telegram_id
        cur.execute(
            f"SELECT id, email, username, name, avatar_url, telegram_id FROM t_p11971418_dog_tinder_project.users WHERE telegram_id = '{telegram_id}'"
        )
        existing_user = cur.fetchone()
        
        display_name = first_name
        if last_name:
            display_name += f' {last_name}'
        
        user_id = None
        
        if existing_user:
            # Обновляем существующего пользователя
            user_id = existing_user['id']
            cur.execute(
                f"UPDATE t_p11971418_dog_tinder_project.users SET name = '{display_name}' WHERE id = {user_id}"
            )
        else:
            # Создаем нового пользователя
            generated_username = username if username else f'user{telegram_id}'
            cur.execute(
                f"INSERT INTO t_p11971418_dog_tinder_project.users (telegram_id, username, name) VALUES ('{telegram_id}', '{generated_username}', '{display_name}') RETURNING id"
            )
            new_user = cur.fetchone()
            user_id = new_user['id']
        
        # Сохраняем session_id с привязкой к user_id и отмечаем как авторизованный
        cur.execute(
            f"INSERT INTO t_p11971418_dog_tinder_project.telegram_auth_sessions (session_id, user_id, authenticated, created_at) VALUES ('{session_id_escaped}', {user_id}, TRUE, NOW()) ON CONFLICT (session_id) DO UPDATE SET user_id = {user_id}, authenticated = TRUE, created_at = NOW()"
        )
        
        conn.commit()
    except Exception as e:
        print(f"DB Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def send_telegram_message(bot_token: str, chat_id: int, text: str):
    '''Отправляет сообщение пользователю в Telegram'''
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"Send message error: {e}")

def send_telegram_message_with_keyboard(bot_token: str, chat_id: int, text: str, keyboard: dict):
    '''Отправляет сообщение с inline клавиатурой'''
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    payload = {
        'chat_id': chat_id,
        'text': text,
        'reply_markup': keyboard
    }
    
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"Send message with keyboard error: {e}")

def success_response(data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(data),
        'isBase64Encoded': False
    }