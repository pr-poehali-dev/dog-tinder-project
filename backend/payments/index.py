import json
import os
import psycopg2
import hashlib
import jwt
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для обработки платежей через Robokassa и webhook уведомлений'''
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    
    is_webhook = method == 'POST' and 'OutSum' in query_params and 'InvId' in query_params

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
        if is_webhook:
            out_sum = query_params.get('OutSum')
            inv_id = query_params.get('InvId')
            signature_value = query_params.get('SignatureValue', '').upper()
            
            password2 = os.environ['ROBOKASSA_PASSWORD_2']
            
            check_string = f"{out_sum}:{inv_id}:{password2}"
            check_signature = hashlib.md5(check_string.encode()).hexdigest().upper()
            
            if check_signature != signature_value:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'text/plain'},
                    'body': 'Invalid signature',
                    'isBase64Encoded': False
                }

            cur.execute(f'''
                UPDATE {schema}.payments
                SET status = %s, paid_at = %s, updated_at = %s
                WHERE robokassa_invoice_id = %s AND status = %s
            ''', ('completed', datetime.utcnow(), datetime.utcnow(), inv_id, 'pending'))
            
            if cur.rowcount > 0:
                cur.execute(f'''
                    SELECT pet_document_id FROM {schema}.payments WHERE robokassa_invoice_id = %s
                ''', (inv_id,))
                result = cur.fetchone()
                
                if result and result[0]:
                    pet_document_id = result[0]
                    cur.execute(f'''
                        UPDATE {schema}.pet_documents
                        SET verification_status = %s
                        WHERE id = %s
                    ''', ('in_review', pet_document_id))
            
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/plain'},
                'body': f'OK{inv_id}',
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            token = auth_header.replace('Bearer ', '') if auth_header else None
            user_id = None
            
            if token:
                try:
                    decoded = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
                    user_id = decoded.get('user_id')
                except:
                    pass

            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }

            body = json.loads(event.get('body', '{}'))
            service_type = body.get('serviceType')
            amount = body.get('amount', 500)
            description = body.get('description', 'Проверка документов питомца')
            pet_document_id = body.get('petDocumentId')

            cur.execute(f'''
                INSERT INTO {schema}.payments (user_id, amount, service_type, description, pet_document_id, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (user_id, amount, service_type, description, pet_document_id, 'pending'))
            payment_id = cur.fetchone()[0]
            conn.commit()

            merchant_login = os.environ['ROBOKASSA_MERCHANT_LOGIN']
            password1 = os.environ['ROBOKASSA_PASSWORD_1']
            
            invoice_id = payment_id
            out_sum = f"{amount:.2f}"
            
            signature_string = f"{merchant_login}:{out_sum}:{invoice_id}:{password1}"
            signature = hashlib.md5(signature_string.encode()).hexdigest()

            payment_url = (
                f"https://auth.robokassa.ru/Merchant/Index.aspx?"
                f"MerchantLogin={merchant_login}&"
                f"OutSum={out_sum}&"
                f"InvId={invoice_id}&"
                f"Description={description}&"
                f"SignatureValue={signature}"
            )

            cur.execute(f'''
                UPDATE {schema}.payments
                SET robokassa_invoice_id = %s
                WHERE id = %s
            ''', (str(invoice_id), payment_id))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'paymentId': payment_id,
                    'paymentUrl': payment_url,
                    'amount': amount
                }),
                'isBase64Encoded': False
            }

        elif method == 'GET':
            payment_id = query_params.get('id')
            
            if payment_id:
                cur.execute(f'''
                    SELECT id, user_id, amount, service_type, description, status, 
                           paid_at, created_at
                    FROM {schema}.payments
                    WHERE id = %s
                ''', (payment_id,))
                payment = cur.fetchone()
                
                if not payment:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Payment not found'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': payment[0],
                    'userId': payment[1],
                    'amount': float(payment[2]),
                    'serviceType': payment[3],
                    'description': payment[4],
                    'status': payment[5],
                    'paidAt': payment[6].isoformat() if payment[6] else None,
                    'createdAt': payment[7].isoformat() if payment[7] else None
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
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