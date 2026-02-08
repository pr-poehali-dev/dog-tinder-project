import json
import os
import hashlib
import bcrypt
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Обновление пароля пользователя после проверки кода восстановления'''
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
        reset_code = body.get('code', '').strip()
        new_password = body.get('password', '').strip()

        if not email or not reset_code or not new_password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Email, код и новый пароль обязательны'})
            }

        if len(new_password) < 6:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'})
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
                'body': json.dumps({'error': 'Пользователь не найден'})
            }
        
        user_id = user[0]
        token_hash = hashlib.sha256(reset_code.encode()).hexdigest()
        
        cur.execute(
            f"SELECT id, expires_at FROM {schema}.password_reset_tokens WHERE user_id = %s AND token_hash = %s",
            (user_id, token_hash)
        )
        token = cur.fetchone()
        
        if not token:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Неверный код восстановления'})
            }
        
        token_id, expires_at = token
        
        if datetime.now() > expires_at:
            cur.execute(f"DELETE FROM {schema}.password_reset_tokens WHERE id = %s", (token_id,))
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Срок действия кода истёк. Запросите новый код'})
            }
        
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            f"UPDATE {schema}.users SET password_hash = %s, updated_at = %s WHERE id = %s",
            (password_hash, datetime.now(), user_id)
        )
        
        cur.execute(f"DELETE FROM {schema}.password_reset_tokens WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Пароль успешно изменён'
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
