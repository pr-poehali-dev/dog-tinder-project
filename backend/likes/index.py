import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления лайками, матчами и чатами"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        query_params = event.get('queryStringParameters') or {}
        resource = query_params.get('resource', 'likes')
        
        if method == 'GET':
            if resource == 'chats':
                return get_chats_or_messages(event, conn)
            else:
                return get_likes(event, conn)
        elif method == 'POST':
            body_str = event.get('body') or '{}'
            body = json.loads(body_str)
            action_type = body.get('action', 'like')
            
            if action_type == 'send_message':
                return send_message(body, conn)
            else:
                return create_like(body, conn)
        
        elif method == 'DELETE':
            body_str = event.get('body') or '{}'
            body = json.loads(body_str)
            return delete_like(body, conn)
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()


def get_likes(event: dict, conn) -> dict:
    """Получить лайки пользователя"""
    
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('user_id')
    action = query_params.get('action', 'outgoing')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if action == 'matches':
            cur.execute('''
                SELECT 
                    m.id as match_id,
                    m.matched_at,
                    p1.id as pet1_id, p1.name as pet1_name, p1.photo_url as pet1_photo,
                    p2.id as pet2_id, p2.name as pet2_name, p2.photo_url as pet2_photo,
                    u1.id as user1_id, u1.name as user1_name,
                    u2.id as user2_id, u2.name as user2_name
                FROM t_p11971418_dog_tinder_project.pet_matches m
                JOIN t_p11971418_dog_tinder_project.pets p1 ON m.pet1_id = p1.id
                JOIN t_p11971418_dog_tinder_project.pets p2 ON m.pet2_id = p2.id
                JOIN t_p11971418_dog_tinder_project.users u1 ON p1.user_id = u1.id
                JOIN t_p11971418_dog_tinder_project.users u2 ON p2.user_id = u2.id
                WHERE u1.id = %s OR u2.id = %s
                ORDER BY m.matched_at DESC
            ''', (user_id, user_id))
            
            matches = cur.fetchall()
            result = []
            
            for match in matches:
                match_dict = dict(match)
                if match_dict.get('matched_at'):
                    match_dict['matched_at'] = match_dict['matched_at'].isoformat()
                result.append(match_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif action == 'incoming':
            cur.execute('''
                SELECT 
                    l.id, l.created_at,
                    p1.id as from_pet_id, p1.name as from_pet_name, p1.photo_url as from_pet_photo,
                    p1.breed as from_pet_breed, p1.age as from_pet_age,
                    u1.id as from_user_id, u1.name as from_user_name
                FROM t_p11971418_dog_tinder_project.pet_likes l
                JOIN t_p11971418_dog_tinder_project.pets p1 ON l.from_pet_id = p1.id
                JOIN t_p11971418_dog_tinder_project.pets p2 ON l.to_pet_id = p2.id
                JOIN t_p11971418_dog_tinder_project.users u1 ON p1.user_id = u1.id
                WHERE p2.user_id = %s
                ORDER BY l.created_at DESC
            ''', (user_id,))
        else:
            cur.execute('''
                SELECT 
                    l.id, l.created_at,
                    p2.id as to_pet_id, p2.name as to_pet_name, p2.photo_url as to_pet_photo,
                    p2.breed as to_pet_breed, p2.age as to_pet_age,
                    u2.id as to_user_id, u2.name as to_user_name
                FROM t_p11971418_dog_tinder_project.pet_likes l
                JOIN t_p11971418_dog_tinder_project.pets p1 ON l.from_pet_id = p1.id
                JOIN t_p11971418_dog_tinder_project.pets p2 ON l.to_pet_id = p2.id
                JOIN t_p11971418_dog_tinder_project.users u2 ON p2.user_id = u2.id
                WHERE p1.user_id = %s
                ORDER BY l.created_at DESC
            ''', (user_id,))
        
        likes = cur.fetchall()
        result = []
        
        for like in likes:
            like_dict = dict(like)
            if like_dict.get('created_at'):
                like_dict['created_at'] = like_dict['created_at'].isoformat()
            result.append(like_dict)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }


def create_like(body: dict, conn) -> dict:
    """Создать лайк"""
    
    from_pet_id = body.get('from_pet_id')
    to_pet_id = body.get('to_pet_id')
    
    if not from_pet_id or not to_pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'from_pet_id and to_pet_id are required'}),
            'isBase64Encoded': False
        }
    
    if from_pet_id == to_pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Cannot like your own pet'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p11971418_dog_tinder_project.pet_likes (from_pet_id, to_pet_id)
            VALUES (%s, %s)
            ON CONFLICT (from_pet_id, to_pet_id) DO NOTHING
            RETURNING id
        ''', (from_pet_id, to_pet_id))
        
        result = cur.fetchone()
        
        cur.execute('''
            SELECT COUNT(*) as count
            FROM t_p11971418_dog_tinder_project.pet_likes
            WHERE from_pet_id = %s AND to_pet_id = %s
        ''', (to_pet_id, from_pet_id))
        
        reverse_like = cur.fetchone()
        is_match = reverse_like['count'] > 0
        
        if is_match:
            pet1_id = min(from_pet_id, to_pet_id)
            pet2_id = max(from_pet_id, to_pet_id)
            
            cur.execute('''
                INSERT INTO t_p11971418_dog_tinder_project.pet_matches (pet1_id, pet2_id)
                VALUES (%s, %s)
                ON CONFLICT (pet1_id, pet2_id) DO NOTHING
                RETURNING id
            ''', (pet1_id, pet2_id))
            
            match_result = cur.fetchone()
            
            if match_result:
                cur.execute('''
                    INSERT INTO t_p11971418_dog_tinder_project.chats (match_id)
                    VALUES (%s)
                    RETURNING id
                ''', (match_result['id'],))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'like_id': result['id'] if result else None,
                'is_match': is_match
            }),
            'isBase64Encoded': False
        }


def get_chats_or_messages(event: dict, conn) -> dict:
    """Получить чаты пользователя или сообщения конкретного чата"""
    
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('user_id')
    chat_id = query_params.get('chat_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if chat_id:
            cur.execute('''
                SELECT 
                    m.id, m.message, m.created_at,
                    m.sender_user_id,
                    u.name as sender_name
                FROM t_p11971418_dog_tinder_project.chat_messages m
                JOIN t_p11971418_dog_tinder_project.users u ON m.sender_user_id = u.id
                WHERE m.chat_id = %s
                ORDER BY m.created_at ASC
            ''', (chat_id,))
            
            messages = cur.fetchall()
            result = []
            
            for msg in messages:
                msg_dict = dict(msg)
                if msg_dict.get('created_at'):
                    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
                result.append(msg_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        else:
            cur.execute('''
                SELECT 
                    c.id as chat_id,
                    c.created_at,
                    m.pet1_id, m.pet2_id,
                    p1.name as pet1_name, p1.photo_url as pet1_photo,
                    p2.name as pet2_name, p2.photo_url as pet2_photo,
                    u1.id as user1_id, u1.name as user1_name,
                    u2.id as user2_id, u2.name as user2_name,
                    (
                        SELECT cm.message 
                        FROM t_p11971418_dog_tinder_project.chat_messages cm 
                        WHERE cm.chat_id = c.id 
                        ORDER BY cm.created_at DESC 
                        LIMIT 1
                    ) as last_message,
                    (
                        SELECT cm.created_at 
                        FROM t_p11971418_dog_tinder_project.chat_messages cm 
                        WHERE cm.chat_id = c.id 
                        ORDER BY cm.created_at DESC 
                        LIMIT 1
                    ) as last_message_at
                FROM t_p11971418_dog_tinder_project.chats c
                JOIN t_p11971418_dog_tinder_project.pet_matches m ON c.match_id = m.id
                JOIN t_p11971418_dog_tinder_project.pets p1 ON m.pet1_id = p1.id
                JOIN t_p11971418_dog_tinder_project.pets p2 ON m.pet2_id = p2.id
                JOIN t_p11971418_dog_tinder_project.users u1 ON p1.user_id = u1.id
                JOIN t_p11971418_dog_tinder_project.users u2 ON p2.user_id = u2.id
                WHERE u1.id = %s OR u2.id = %s
                ORDER BY COALESCE(last_message_at, c.created_at) DESC
            ''', (user_id, user_id))
            
            chats = cur.fetchall()
            result = []
            
            for chat in chats:
                chat_dict = dict(chat)
                if chat_dict.get('created_at'):
                    chat_dict['created_at'] = chat_dict['created_at'].isoformat()
                if chat_dict.get('last_message_at'):
                    chat_dict['last_message_at'] = chat_dict['last_message_at'].isoformat()
                result.append(chat_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }


def delete_like(body: dict, conn) -> dict:
    """Удалить лайк"""
    
    from_pet_id = body.get('from_pet_id')
    to_pet_id = body.get('to_pet_id')
    
    if not from_pet_id or not to_pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'from_pet_id and to_pet_id are required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            DELETE FROM t_p11971418_dog_tinder_project.pet_likes
            WHERE from_pet_id = %s AND to_pet_id = %s
        ''', (from_pet_id, to_pet_id))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }


def send_message(body: dict, conn) -> dict:
    """Отправить сообщение в чат"""
    
    chat_id = body.get('chat_id')
    sender_user_id = body.get('sender_user_id')
    message = body.get('message')
    
    if not chat_id or not sender_user_id or not message:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'chat_id, sender_user_id and message are required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p11971418_dog_tinder_project.chat_messages (chat_id, sender_user_id, message)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        ''', (chat_id, sender_user_id, message))
        
        result = cur.fetchone()
        conn.commit()
        
        result_dict = dict(result)
        if result_dict.get('created_at'):
            result_dict['created_at'] = result_dict['created_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message_id': result_dict['id'],
                'created_at': result_dict['created_at']
            }),
            'isBase64Encoded': False
        }