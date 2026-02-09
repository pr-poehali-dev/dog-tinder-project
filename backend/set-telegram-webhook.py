"""
Скрипт для установки webhook Telegram бота
Запустите этот скрипт один раз после развертывания функции
"""
import os
import requests

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
WEBHOOK_URL = 'https://functions.poehali.dev/9a63f705-b62a-4c1f-b49c-4ce497cabd2d'
WEBHOOK_SECRET = os.environ.get('TELEGRAM_WEBHOOK_SECRET', '')

if not BOT_TOKEN:
    print('ERROR: TELEGRAM_BOT_TOKEN not set')
    exit(1)

# Устанавливаем webhook
url = f'https://api.telegram.org/bot{BOT_TOKEN}/setWebhook'
data = {
    'url': WEBHOOK_URL,
    'drop_pending_updates': True
}

if WEBHOOK_SECRET:
    data['secret_token'] = WEBHOOK_SECRET

response = requests.post(url, json=data)
print('Response:', response.json())

if response.json().get('ok'):
    print(f'✅ Webhook установлен успешно: {WEBHOOK_URL}')
else:
    print(f'❌ Ошибка установки webhook: {response.json()}')
