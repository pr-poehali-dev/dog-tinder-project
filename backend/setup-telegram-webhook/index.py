'''Настройка webhook для Telegram бота'''

import json
import os
import requests

def handler(event: dict, context) -> dict:
    '''Настраивает webhook для Telegram бота'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        webhook_url = 'https://functions.poehali.dev/933e74d4-aa38-421d-9e38-1b5281a86b50'
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN not configured'}),
                'isBase64Encoded': False
            }
        
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action', 'set')
        
        if action == 'set':
            # Устанавливаем webhook
            response = requests.post(
                f'https://api.telegram.org/bot{bot_token}/setWebhook',
                json={'url': webhook_url},
                timeout=10
            )
            result = response.json()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': result.get('ok', False),
                    'description': result.get('description', ''),
                    'webhook_url': webhook_url
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'info':
            # Получаем информацию о webhook
            response = requests.get(
                f'https://api.telegram.org/bot{bot_token}/getWebhookInfo',
                timeout=10
            )
            result = response.json()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif action == 'delete':
            # Удаляем webhook
            response = requests.post(
                f'https://api.telegram.org/bot{bot_token}/deleteWebhook',
                timeout=10
            )
            result = response.json()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action. Use: set, info, delete'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
