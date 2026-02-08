import json
import os
import random
import smtplib
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

        reset_code = str(random.randint(100000, 999999))
        
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.yandex.ru')
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')

        if not smtp_user or not smtp_password:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Email отправка не настроена'})
            }

        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Код восстановления пароля TinDog'
        msg['From'] = smtp_user
        msg['To'] = email

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

        msg.attach(MIMEText(html, 'html', 'utf-8'))

        with smtplib.SMTP_SSL(smtp_host, 465) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

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

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }