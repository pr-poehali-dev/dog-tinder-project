import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

# Force redeploy: Updated POLZA_AI_API_KEY to new BotHub JWT token (Jan 27, 2026)
import base64
import uuid
import requests

def handler(event: dict, context) -> dict:
    """API для управления объявлениями о питомцах"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'GET':
            return get_pets(event, conn)
        elif method == 'POST':
            return create_pet(event, conn)
        elif method == 'PUT':
            return update_pet(event, conn)
        elif method == 'DELETE':
            return delete_pet(event, conn)
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()


def get_pets(event: dict, conn) -> dict:
    """Получить список питомцев или конкретного питомца"""
    
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('user_id')
    pet_id = query_params.get('pet_id')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if pet_id:
            cur.execute('''
                SELECT p.*, u.email as owner_email, u.name as owner_name
                FROM t_p11971418_dog_tinder_project.pets p
                LEFT JOIN t_p11971418_dog_tinder_project.users u ON p.user_id = u.id
                WHERE p.id = %s AND p.is_active = true
            ''', (pet_id,))
            pet = cur.fetchone()
            
            if not pet:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Pet not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT * FROM t_p11971418_dog_tinder_project.pet_documents_storage
                WHERE pet_id = %s
                ORDER BY uploaded_at DESC
            ''', (pet_id,))
            documents = cur.fetchall()
            
            pet_dict = dict(pet)
            pet_dict['documents'] = [dict(doc) for doc in documents]
            
            if pet_dict.get('created_at'):
                pet_dict['created_at'] = pet_dict['created_at'].isoformat()
            if pet_dict.get('updated_at'):
                pet_dict['updated_at'] = pet_dict['updated_at'].isoformat()
            if pet_dict.get('verification_paid_at'):
                pet_dict['verification_paid_at'] = pet_dict['verification_paid_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(pet_dict),
                'isBase64Encoded': False
            }
        
        if user_id:
            cur.execute('''
                SELECT * FROM t_p11971418_dog_tinder_project.pets
                WHERE user_id = %s
                ORDER BY is_active DESC, created_at DESC
            ''', (user_id,))
        else:
            cur.execute('''
                SELECT p.*, u.name as owner_name, u.city as owner_city
                FROM t_p11971418_dog_tinder_project.pets p
                LEFT JOIN t_p11971418_dog_tinder_project.users u ON p.user_id = u.id
                WHERE p.is_active = true
                ORDER BY p.created_at DESC
            ''')
        
        pets = cur.fetchall()
        pets_list = []
        
        for pet in pets:
            pet_dict = dict(pet)
            if pet_dict.get('created_at'):
                pet_dict['created_at'] = pet_dict['created_at'].isoformat()
            if pet_dict.get('updated_at'):
                pet_dict['updated_at'] = pet_dict['updated_at'].isoformat()
            if pet_dict.get('verification_paid_at'):
                pet_dict['verification_paid_at'] = pet_dict['verification_paid_at'].isoformat()
            pets_list.append(pet_dict)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(pets_list),
            'isBase64Encoded': False
        }


def create_pet(event: dict, conn) -> dict:
    """Создать объявление о питомце"""
    
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    
    if action == 'upload_photo':
        return upload_photo(body)
    elif action == 'upload_document':
        return upload_document(body, conn)
    elif action == 'pay_verification':
        return pay_verification(body, conn)
    
    user_id = body.get('user_id')
    name = body.get('name')
    breed = body.get('breed')
    age = body.get('age')
    gender = body.get('gender')
    rank = body.get('rank')
    city = body.get('city')
    description = body.get('description')
    breeding_price = body.get('breeding_price')
    photo_url = body.get('photo_url')
    
    if not user_id or not name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id and name are required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p11971418_dog_tinder_project.pets 
            (user_id, name, species, breed, age, gender, rank, city, description, breeding_price, photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        ''', (user_id, name, 'dog', breed, age, gender, rank, city, description, breeding_price, photo_url))
        
        new_pet = cur.fetchone()
        conn.commit()
        
        pet_dict = dict(new_pet)
        if pet_dict.get('created_at'):
            pet_dict['created_at'] = pet_dict['created_at'].isoformat()
        if pet_dict.get('updated_at'):
            pet_dict['updated_at'] = pet_dict['updated_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'pet': pet_dict}),
            'isBase64Encoded': False
        }


def verify_dog_image(image_data: str) -> bool:
    """Проверить, что на изображении собака через AI"""
    
    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        print('WARNING: POLZA_AI_API_KEY not found, skipping verification')
        return True
    
    try:
        print(f'Starting dog verification for image (length: {len(image_data)})')
        print(f'Using API key: {api_key[:10]}...')
        
        response = requests.post(
            'https://bothub.chat/api/v2/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-4o',
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'text',
                                'text': 'Analyze this image. Is there a dog in it? Answer ONLY with "YES" if there is a dog, or "NO" if there is no dog.'
                            },
                            {
                                'type': 'image_url',
                                'image_url': {
                                    'url': image_data if image_data.startswith('data:') else f'data:image/jpeg;base64,{image_data}'
                                }
                            }
                        ]
                    }
                ],
                'max_tokens': 10
            },
            timeout=15
        )
        
        print(f'AI response status: {response.status_code}')
        
        if response.status_code == 401:
            print(f'ERROR: AI API key is invalid (401 UNAUTHORIZED).')
            print(f'Response body: {response.text}')
            print(f'WARNING: Skipping verification due to invalid API key')
            return True
        
        if response.status_code != 200:
            print(f'ERROR: AI API returned {response.status_code}: {response.text}')
            print(f'WARNING: Skipping verification due to API error')
            return True
        
        result = response.json()
        answer = result.get('choices', [{}])[0].get('message', {}).get('content', '').lower().strip()
        
        print(f'AI answer: {answer}')
        
        is_dog = 'yes' in answer or 'да' in answer
        print(f'Dog detected: {is_dog}')
        
        return is_dog
        
    except Exception as e:
        print(f'ERROR: Image verification failed: {str(e)}')
        print(f'WARNING: Skipping verification due to exception')
        return True


def upload_photo(body: dict) -> dict:
    """Загрузить фото питомца в S3 с проверкой на наличие собаки"""
    
    image = body.get('image')
    if not image:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Image is required'}),
            'isBase64Encoded': False
        }
    
    original_image = image
    if ',' in image:
        image = image.split(',')[1]
    
    is_dog = verify_dog_image(original_image)
    if not is_dog:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'На фото должна быть собака. Пожалуйста, загрузите фотографию вашего питомца.'}),
            'isBase64Encoded': False
        }
    
    image_data = base64.b64decode(image)
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    filename = f'pets/{uuid.uuid4()}.jpg'
    
    s3.put_object(
        Bucket='files',
        Key=filename,
        Body=image_data,
        ContentType='image/jpeg'
    )
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': cdn_url}),
        'isBase64Encoded': False
    }


def upload_document(body: dict, conn) -> dict:
    """Загрузить документ питомца"""
    
    pet_id = body.get('pet_id')
    document = body.get('document')
    document_type = body.get('document_type', 'passport')
    
    if not pet_id or not document:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'pet_id and document are required'}),
            'isBase64Encoded': False
        }
    
    if ',' in document:
        document = document.split(',')[1]
    
    doc_data = base64.b64decode(document)
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    filename = f'documents/{uuid.uuid4()}.pdf'
    
    s3.put_object(
        Bucket='files',
        Key=filename,
        Body=doc_data,
        ContentType='application/pdf'
    )
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO t_p11971418_dog_tinder_project.pet_documents_storage 
            (pet_id, document_type, document_url)
            VALUES (%s, %s, %s)
            RETURNING *
        ''', (pet_id, document_type, cdn_url))
        
        doc = cur.fetchone()
        conn.commit()
        
        doc_dict = dict(doc)
        if doc_dict.get('uploaded_at'):
            doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'document': doc_dict}),
            'isBase64Encoded': False
        }


def pay_verification(body: dict, conn) -> dict:
    """Оплатить проверку документов"""
    
    pet_id = body.get('pet_id')
    
    if not pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'pet_id is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            UPDATE t_p11971418_dog_tinder_project.pets
            SET verification_paid = true, verification_paid_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        ''', (pet_id,))
        
        updated_pet = cur.fetchone()
        conn.commit()
        
        if not updated_pet:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Pet not found'}),
                'isBase64Encoded': False
            }
        
        pet_dict = dict(updated_pet)
        if pet_dict.get('created_at'):
            pet_dict['created_at'] = pet_dict['created_at'].isoformat()
        if pet_dict.get('updated_at'):
            pet_dict['updated_at'] = pet_dict['updated_at'].isoformat()
        if pet_dict.get('verification_paid_at'):
            pet_dict['verification_paid_at'] = pet_dict['verification_paid_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'pet': pet_dict, 'message': 'Verification paid successfully'}),
            'isBase64Encoded': False
        }


def update_pet(event: dict, conn) -> dict:
    """Обновить объявление о питомце"""
    
    body = json.loads(event.get('body', '{}'))
    pet_id = body.get('pet_id')
    
    print(f"DEBUG: Update pet request - pet_id={pet_id}, breeding_price={body.get('breeding_price')}")
    
    if not pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'pet_id is required'}),
            'isBase64Encoded': False
        }
    
    update_fields = []
    update_values = []
    
    for field in ['name', 'breed', 'age', 'gender', 'rank', 'city', 'description', 'photo_url', 'is_active', 'breeding_price']:
        if field in body:
            update_fields.append(f"{field} = %s")
            update_values.append(body[field])
    
    if not update_fields:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    update_values.append(pet_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = f'''
            UPDATE t_p11971418_dog_tinder_project.pets
            SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        '''
        cur.execute(query, update_values)
        updated_pet = cur.fetchone()
        conn.commit()
        
        if not updated_pet:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Pet not found'}),
                'isBase64Encoded': False
            }
        
        pet_dict = dict(updated_pet)
        if pet_dict.get('created_at'):
            pet_dict['created_at'] = pet_dict['created_at'].isoformat()
        if pet_dict.get('updated_at'):
            pet_dict['updated_at'] = pet_dict['updated_at'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'pet': pet_dict}),
            'isBase64Encoded': False
        }


def delete_pet(event: dict, conn) -> dict:
    """Удалить объявление о питомце (мягкое удаление)"""
    
    query_params = event.get('queryStringParameters') or {}
    pet_id = query_params.get('pet_id')
    
    if not pet_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'pet_id is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute('''
            UPDATE t_p11971418_dog_tinder_project.pets
            SET is_active = false
            WHERE id = %s
        ''', (pet_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Pet deleted successfully'}),
            'isBase64Encoded': False
        }