import json
import os
import random
import smtplib
import hashlib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''Отправка кода восстановления пароля на email пользователя'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str == '':
            body_str = '{}'
        
        body = json.loads(body_str)
        email = body.get('email', '').strip()

        if not email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Email обязателен'})
            }

        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Пользователь с таким email не найден'})
            }
        
        user_id = user[0]
        reset_code = str(random.randint(100000, 999999))
        token_hash = hashlib.sha256(reset_code.encode()).hexdigest()
        expires_at = datetime.now() + timedelta(minutes=15)
        
        cur.execute(
            f"DELETE FROM {schema}.password_reset_tokens WHERE user_id = %s",
            (user_id,)
        )
        
        cur.execute(
            f"INSERT INTO {schema}.password_reset_tokens (user_id, token_hash, expires_at) VALUES (%s, %s, %s)",
            (user_id, token_hash, expires_at)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        unisender_api_key = os.environ.get('UNISENDER_API_KEY')
        unisender_sender_email = os.environ.get('UNISENDER_SENDER_EMAIL')
        
        if not unisender_api_key or not unisender_sender_email:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Email отправка не настроена'})
            }
        
        import requests
        
        html = f'''
        <html>
          <body style="font-family: Arial, sans-serif; background: linear-gradient(to bottom right, #ec4899, #f97316); padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
              <h1 style="color: #ec4899; font-size: 32px; margin-bottom: 20px;">🐾 TinDog</h1>
              <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Восстановление пароля</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Вы запросили код для восстановления пароля. Введите этот код в приложении:
              </p>
              <div style="background: #fef3c7; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: #92400e; font-size: 14px; margin-bottom: 10px;">Ваш код:</p>
                <p style="font-size: 48px; font-weight: bold; color: #ec4899; letter-spacing: 8px; margin: 0;">{reset_code}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Код действителен в течение 15 минут. Если вы не запрашивали восстановление пароля, просто игнорируйте это письмо.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                TinDog - найди друзей для своего питомца
              </p>
            </div>
          </body>
        </html>
        '''
        
        payload = {
            'message': {
                'recipients': [
                    {
                        'email': email,
                        'substitutions': {
                            'code': reset_code
                        }
                    }
                ],
                'body': {
                    'html': html
                },
                'subject': 'Код восстановления пароля TinDog',
                'from_email': unisender_sender_email,
                'from_name': 'TinDog',
                'track_read': 0,
                'track_links': 0
            }
        }
        
        response = requests.post(
            'https://go1.unisender.ru/ru/transactional/api/v1/email/send.json',
            headers={
                'X-API-KEY': unisender_api_key,
                'Content-Type': 'application/json'
            },
            json=payload
        )
        
        response_data = {}
        try:
            response_data = response.json()
        except:
            pass
        
        if response.status_code != 200:
            error_msg = str(response_data) if response_data else response.text
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Ошибка отправки email: {error_msg}',
                    'status_code': response.status_code
                })
            }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Код отправлен на email',
                'code': reset_code
            })
        }

    except psycopg2.Error as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }