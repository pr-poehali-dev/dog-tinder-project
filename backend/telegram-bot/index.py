"""
Telegram бот для авторизации в TinDog
Обрабатывает webhook от Telegram и команду /start для авторизации
"""
import json
import os
import hmac
import hashlib
import psycopg2
import jwt
from datetime import datetime, timedelta

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
BOT_USERNAME = os.environ.get('TELEGRAM_BOT_USERNAME', 'tindog_bot')
WEBHOOK_SECRET = os.environ.get('TELEGRAM_WEBHOOK_SECRET', '')
JWT_SECRET = os.environ.get('JWT_SECRET')
DATABASE_URL = os.environ.get('DATABASE_URL')

def verify_telegram_webhook(secret_token: str, request_secret: str) -> bool:
    """Проверка webhook секрета от Telegram"""
    if not WEBHOOK_SECRET:
        return True
    return hmac.compare_digest(secret_token, request_secret)

def send_telegram_message(chat_id: int, text: str):
    """Отправка сообщения через Telegram Bot API"""
    import urllib.request
    import urllib.parse
    
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    data = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode()
    
    try:
        urllib.request.urlopen(url, data=data)
    except Exception as e:
        print(f'Error sending message: {e}')

def create_or_update_user(telegram_id: int, username: str = None, first_name: str = None):
    """Создание или обновление пользователя в БД"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Проверяем существует ли пользователь
        cur.execute(
            "SELECT id, email, name, avatar_url FROM users WHERE telegram_id = %s",
            (str(telegram_id),)
        )
        user = cur.fetchone()
        
        if user:
            user_id = user[0]
        else:
            # Создаем нового пользователя
            display_name = first_name or username or f'User{telegram_id}'
            cur.execute(
                """INSERT INTO users (telegram_id, name, email, created_at) 
                   VALUES (%s, %s, NULL, NOW()) 
                   RETURNING id""",
                (str(telegram_id), display_name)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            
            # Получаем данные созданного пользователя
            cur.execute(
                "SELECT id, email, name, avatar_url FROM users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
        
        return {
            'id': user[0],
            'email': user[1],
            'name': user[2],
            'avatar_url': user[3],
            'telegram_id': str(telegram_id)
        }
    finally:
        cur.close()
        conn.close()

def save_auth_session(session_id: str, user_id: int, telegram_id: int):
    """Сохранение сессии авторизации для polling"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Создаем таблицу если её нет
        cur.execute("""
            CREATE TABLE IF NOT EXISTS telegram_auth_sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                user_id INTEGER NOT NULL,
                telegram_id BIGINT NOT NULL,
                authenticated BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 minutes'
            )
        """)
        
        # Сохраняем сессию
        cur.execute(
            """INSERT INTO telegram_auth_sessions (session_id, user_id, telegram_id, authenticated)
               VALUES (%s, %s, %s, TRUE)
               ON CONFLICT (session_id) DO UPDATE 
               SET authenticated = TRUE, user_id = %s, telegram_id = %s""",
            (session_id, user_id, telegram_id, user_id, telegram_id)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

def generate_tokens(user: dict):
    """Генерация JWT токенов"""
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
    
    return access_token, refresh_token

def handler(event: dict, context) -> dict:
    """Обработчик webhook от Telegram"""
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Bot-Api-Secret-Token'
            },
            'body': ''
        }
    
    # Проверяем секрет webhook
    headers = event.get('headers', {})
    secret_token = headers.get('X-Telegram-Bot-Api-Secret-Token', headers.get('x-telegram-bot-api-secret-token', ''))
    
    if WEBHOOK_SECRET and not verify_telegram_webhook(WEBHOOK_SECRET, secret_token):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid secret token'})
        }
    
    # Парсим обновление от Telegram
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'message' not in body:
            return {'statusCode': 200, 'body': json.dumps({'ok': True})}
        
        message = body['message']
        chat_id = message['chat']['id']
        telegram_id = message['from']['id']
        username = message['from'].get('username')
        first_name = message['from'].get('first_name')
        text = message.get('text', '')
        
        # Обработка команды /start
        if text.startswith('/start'):
            # Извлекаем session_id из параметра
            parts = text.split(' ')
            session_id = None
            
            if len(parts) > 1 and parts[1].startswith('web_auth_'):
                session_id = parts[1].replace('web_auth_', '')
            
            # Создаем или обновляем пользователя
            user = create_or_update_user(telegram_id, username, first_name)
            
            if session_id:
                # Сохраняем сессию для web-авторизации
                save_auth_session(session_id, user['id'], telegram_id)
                
                send_telegram_message(
                    chat_id,
                    f"✅ <b>Авторизация успешна!</b>\n\n"
                    f"Привет, {first_name or username or 'друг'}! Можешь вернуться на сайт TinDog.\n\n"
                    f"Окно браузера закроется автоматически через несколько секунд."
                )
            else:
                # Обычный /start без авторизации
                send_telegram_message(
                    chat_id,
                    f"🐕 <b>Добро пожаловать в TinDog!</b>\n\n"
                    f"Привет, {first_name or username or 'друг'}!\n\n"
                    f"Чтобы войти на сайт, нажми кнопку 'Войти через Telegram' на сайте tindog.ru"
                )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
        
    except Exception as e:
        print(f'Error processing update: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
