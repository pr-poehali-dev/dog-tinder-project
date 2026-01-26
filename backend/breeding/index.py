'''API для управления процессами вязки'''
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        if method == 'GET':
            return handle_get(event)
        elif method == 'POST':
            return handle_post(event)
        else:
            return error_response(405, 'Method not allowed')
    except Exception as e:
        print(f"Error: {e}")
        return error_response(500, str(e))


def handle_get(event: dict) -> dict:
    '''Получить информацию о процессе вязки'''
    params = event.get('queryStringParameters', {}) or {}
    process_id = params.get('process_id')
    chat_id = params.get('chat_id')
    user_id = params.get('user_id')
    
    if not process_id and not chat_id:
        return error_response(400, 'process_id or chat_id required')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        S = get_schema()
        
        if process_id:
            cur.execute(f'''
                SELECT bp.*, 
                       p1.name as pet1_name, p2.name as pet2_name,
                       u1.name as owner1_name, u2.name as owner2_name
                FROM {S}breeding_processes bp
                JOIN {S}pets p1 ON bp.pet1_id = p1.id
                JOIN {S}pets p2 ON bp.pet2_id = p2.id
                JOIN {S}users u1 ON bp.user1_id = u1.id
                JOIN {S}users u2 ON bp.user2_id = u2.id
                WHERE bp.id = %s
            ''', (process_id,))
        else:
            cur.execute(f'''
                SELECT bp.*, 
                       p1.name as pet1_name, p2.name as pet2_name,
                       u1.name as owner1_name, u2.name as owner2_name
                FROM {S}breeding_processes bp
                JOIN {S}pets p1 ON bp.pet1_id = p1.id
                JOIN {S}pets p2 ON bp.pet2_id = p2.id
                JOIN {S}users u1 ON bp.user1_id = u1.id
                JOIN {S}users u2 ON bp.user2_id = u2.id
                WHERE bp.chat_id = %s
            ''', (chat_id,))
        
        process = cur.fetchone()
        
        if not process:
            if user_id and chat_id:
                return success_response({'has_process': False})
            return error_response(404, 'Process not found')
        
        process_dict = dict(process)
        if process_dict.get('meeting_date'):
            process_dict['meeting_date'] = process_dict['meeting_date'].isoformat()
        if process_dict.get('meeting_time'):
            process_dict['meeting_time'] = str(process_dict['meeting_time'])
        if process_dict.get('created_at'):
            process_dict['created_at'] = process_dict['created_at'].isoformat()
        if process_dict.get('updated_at'):
            process_dict['updated_at'] = process_dict['updated_at'].isoformat()
        if process_dict.get('completed_at'):
            process_dict['completed_at'] = process_dict['completed_at'].isoformat()
        
        return success_response(process_dict)
    finally:
        cur.close()
        conn.close()


def handle_post(event: dict) -> dict:
    '''Создать процесс или обновить стадию'''
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    
    if action == 'create':
        return create_process(body)
    elif action == 'update_stage':
        return update_stage(body)
    else:
        return error_response(400, 'Unknown action')


def create_process(data: dict) -> dict:
    '''Создать новый процесс вязки'''
    chat_id = data.get('chat_id')
    pet1_id = data.get('pet1_id')
    pet2_id = data.get('pet2_id')
    user1_id = data.get('user1_id')
    user2_id = data.get('user2_id')
    meeting_date = data.get('meeting_date')
    meeting_time = data.get('meeting_time')
    location = data.get('location')
    address = data.get('address')
    with_vet = data.get('with_vet', False)
    vet_id = data.get('vet_id')
    vet_name = data.get('vet_name')
    
    if not all([chat_id, pet1_id, pet2_id, user1_id, user2_id, meeting_date, meeting_time, location]):
        return error_response(400, 'Missing required fields')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        S = get_schema()
        
        cur.execute(f'''
            INSERT INTO {S}breeding_processes 
            (chat_id, pet1_id, pet2_id, user1_id, user2_id, 
             meeting_date, meeting_time, location, address,
             with_vet, vet_id, vet_name, current_stage)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'planning')
            RETURNING id, chat_id, current_stage, created_at
        ''', (chat_id, pet1_id, pet2_id, user1_id, user2_id,
              meeting_date, meeting_time, location, address,
              with_vet, vet_id, vet_name))
        
        process = cur.fetchone()
        conn.commit()
        
        process_dict = dict(process)
        if process_dict.get('created_at'):
            process_dict['created_at'] = process_dict['created_at'].isoformat()
        
        return success_response(process_dict)
    finally:
        cur.close()
        conn.close()


def update_stage(data: dict) -> dict:
    '''Обновить текущий этап процесса'''
    process_id = data.get('process_id')
    stage_id = data.get('stage_id')
    user_id = data.get('user_id')
    
    if not all([process_id, stage_id, user_id]):
        return error_response(400, 'Missing required fields')
    
    valid_stages = ['planning', 'acquaintance', 'first_mating', 'control_mating', 'completed']
    if stage_id not in valid_stages:
        return error_response(400, 'Invalid stage_id')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        S = get_schema()
        
        cur.execute(f'''
            SELECT user1_id, user2_id, current_stage, stages_completed
            FROM {S}breeding_processes
            WHERE id = %s
        ''', (process_id,))
        
        process = cur.fetchone()
        if not process:
            return error_response(404, 'Process not found')
        
        if user_id not in [process['user1_id'], process['user2_id']]:
            return error_response(403, 'Access denied')
        
        stages_completed = process.get('stages_completed', []) or []
        if isinstance(stages_completed, str):
            stages_completed = json.loads(stages_completed)
        
        if process['current_stage'] not in stages_completed:
            stages_completed.append(process['current_stage'])
        
        update_fields = {
            'current_stage': stage_id,
            'stages_completed': json.dumps(stages_completed),
            'updated_at': datetime.now()
        }
        
        if stage_id == 'completed':
            update_fields['completed_at'] = datetime.now()
        
        cur.execute(f'''
            UPDATE {S}breeding_processes
            SET current_stage = %s, 
                stages_completed = %s,
                updated_at = NOW()
                {', completed_at = NOW()' if stage_id == 'completed' else ''}
            WHERE id = %s
            RETURNING id, current_stage, updated_at
        ''', (stage_id, json.dumps(stages_completed), process_id))
        
        updated = cur.fetchone()
        conn.commit()
        
        updated_dict = dict(updated)
        if updated_dict.get('updated_at'):
            updated_dict['updated_at'] = updated_dict['updated_at'].isoformat()
        
        return success_response(updated_dict)
    finally:
        cur.close()
        conn.close()


def get_db_connection():
    '''Получить подключение к БД'''
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    '''Получить префикс схемы БД'''
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def success_response(data: dict) -> dict:
    '''Успешный ответ'''
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }


def error_response(status: int, message: str) -> dict:
    '''Ошибка'''
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }
