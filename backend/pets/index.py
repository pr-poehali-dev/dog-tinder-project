import json
import os
import psycopg2
import jwt
import base64
import uuid
import boto3
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления объявлениями о питомцах и загрузкой документов'''
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    
    is_document_upload = query_params.get('action') == 'upload_document'

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    try:
        auth_header = event.get('headers', {}).get('X-Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header else None
        user_id = None
        
        if token:
            try:
                decoded = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
                user_id = decoded.get('user_id')
            except:
                pass

        if is_document_upload and method == 'POST':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            file_base64 = body.get('file')
            file_name = body.get('fileName', f'document_{uuid.uuid4()}.pdf')
            document_type = body.get('documentType', 'other')
            pet_id = body.get('petId')
            
            if not file_base64 or not pet_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'File and petId are required'}),
                    'isBase64Encoded': False
                }

            file_data = base64.b64decode(file_base64)
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            
            file_extension = file_name.split('.')[-1] if '.' in file_name else 'pdf'
            unique_filename = f'documents/{uuid.uuid4()}.{file_extension}'
            
            content_type = 'application/pdf'
            if file_extension.lower() in ['jpg', 'jpeg']:
                content_type = 'image/jpeg'
            elif file_extension.lower() == 'png':
                content_type = 'image/png'
            
            s3.put_object(
                Bucket='files',
                Key=unique_filename,
                Body=file_data,
                ContentType=content_type
            )
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
            
            cur.execute(f'''
                INSERT INTO {schema}.pet_documents (pet_id, user_id, document_type, document_url, verification_status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            ''', (pet_id, user_id, document_type, cdn_url, 'pending'))
            document_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': document_id,
                    'url': cdn_url,
                    'fileName': file_name,
                    'documentType': document_type,
                    'uploadedAt': datetime.utcnow().isoformat()
                }),
                'isBase64Encoded': False
            }

        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            pet_id = query_params.get('id')
            
            if pet_id:
                cur.execute(f'''
                    SELECT p.id, p.user_id, p.name, p.species, p.breed, p.age, p.gender, 
                           p.description, p.photo_url, p.created_at, u.name as owner_name, u.city
                    FROM {schema}.pets p
                    LEFT JOIN {schema}.users u ON p.user_id = u.id
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
                
                cur.execute(f'''
                    SELECT id, document_type, document_url, verification_status, verified_at
                    FROM {schema}.pet_documents
                    WHERE pet_id = %s
                    ORDER BY uploaded_at DESC
                ''', (pet_id,))
                documents = cur.fetchall()
                
                result = {
                    'id': pet[0],
                    'userId': pet[1],
                    'name': pet[2],
                    'species': pet[3],
                    'breed': pet[4],
                    'age': pet[5],
                    'gender': pet[6],
                    'description': pet[7],
                    'photoUrl': pet[8],
                    'createdAt': pet[9].isoformat() if pet[9] else None,
                    'ownerName': pet[10],
                    'city': pet[11],
                    'documents': [{
                        'id': doc[0],
                        'documentType': doc[1],
                        'documentUrl': doc[2],
                        'verificationStatus': doc[3],
                        'verifiedAt': doc[4].isoformat() if doc[4] else None
                    } for doc in documents]
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            else:
                owner_id = query_params.get('userId')
                if owner_id:
                    cur.execute(f'''
                        SELECT p.id, p.name, p.species, p.breed, p.age, p.gender, 
                               p.photo_url, p.created_at
                        FROM {schema}.pets p
                        WHERE p.user_id = %s AND p.is_active = true
                        ORDER BY p.created_at DESC
                    ''', (owner_id,))
                else:
                    cur.execute(f'''
                        SELECT p.id, p.name, p.species, p.breed, p.age, p.gender, 
                               p.photo_url, p.created_at, u.city
                        FROM {schema}.pets p
                        LEFT JOIN {schema}.users u ON p.user_id = u.id
                        WHERE p.is_active = true
                        ORDER BY p.created_at DESC
                    ''')
                
                pets = cur.fetchall()
                result = [{
                    'id': pet[0],
                    'name': pet[1],
                    'species': pet[2],
                    'breed': pet[3],
                    'age': pet[4],
                    'gender': pet[5],
                    'photoUrl': pet[6],
                    'createdAt': pet[7].isoformat() if pet[7] else None,
                    'city': pet[8] if len(pet) > 8 else None
                } for pet in pets]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }

        elif method == 'POST':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(f'''
                INSERT INTO {schema}.pets (user_id, name, species, breed, age, gender, description, photo_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                user_id,
                body.get('name'),
                body.get('species'),
                body.get('breed'),
                body.get('age'),
                body.get('gender'),
                body.get('description'),
                body.get('photoUrl')
            ))
            pet_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': pet_id, 'message': 'Pet created successfully'}),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            pet_id = body.get('id')
            
            cur.execute(f'SELECT user_id FROM {schema}.pets WHERE id = %s', (pet_id,))
            result = cur.fetchone()
            
            if not result or result[0] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                UPDATE {schema}.pets
                SET name = %s, species = %s, breed = %s, age = %s, gender = %s,
                    description = %s, photo_url = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                body.get('name'),
                body.get('species'),
                body.get('breed'),
                body.get('age'),
                body.get('gender'),
                body.get('description'),
                body.get('photoUrl'),
                pet_id
            ))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Pet updated successfully'}),
                'isBase64Encoded': False
            }

        elif method == 'DELETE':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            query_params = event.get('queryStringParameters') or {}
            pet_id = query_params.get('id')
            
            cur.execute(f'SELECT user_id FROM {schema}.pets WHERE id = %s', (pet_id,))
            result = cur.fetchone()
            
            if not result or result[0] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'UPDATE {schema}.pets SET is_active = false WHERE id = %s', (pet_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Pet deleted successfully'}),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()