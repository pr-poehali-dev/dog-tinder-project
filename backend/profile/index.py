'''API для управления профилем пользователя'''
import json
import os
import base64
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'POST')
    
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
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'upload_avatar':
            return upload_avatar(body)
        elif action == 'update_profile':
            return update_profile(body)
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

def upload_avatar(body: dict) -> dict:
    image_data = body.get('image', '')
    
    if not image_data:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Image data required'})
        }
    
    try:
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        
        file_key = f"avatars/avatar_{int(os.urandom(4).hex(), 16)}.jpg"
        
        s3.put_object(
            Bucket='files',
            Key=file_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'url': cdn_url})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }

def update_profile(body: dict) -> dict:
    user_id = body.get('user_id')
    name = body.get('name')
    city = body.get('city')
    avatar_url = body.get('avatar_url')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        update_parts = []
        params = []
        
        if name is not None:
            update_parts.append('name = %s')
            params.append(name)
        
        if city is not None:
            update_parts.append('city = %s')
            params.append(city)
        
        if avatar_url is not None:
            update_parts.append('avatar_url = %s')
            params.append(avatar_url)
        
        if not update_parts:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No fields to update'})
            }
        
        params.append(user_id)
        query = f"UPDATE t_p11971418_dog_tinder_project.users SET {', '.join(update_parts)} WHERE id = %s RETURNING id, email, username, name, city, avatar_url, username_updated_at"
        
        cur.execute(query, params)
        updated_user = cur.fetchone()
        conn.commit()
        
        if not updated_user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        user_dict = dict(updated_user)
        if user_dict.get('username_updated_at'):
            user_dict['username_updated_at'] = user_dict['username_updated_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': user_dict})
        }
    finally:
        cur.close()
        conn.close()
