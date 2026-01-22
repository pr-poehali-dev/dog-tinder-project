"""
Маршрутизатор авторизации с отправкой email-кодов.

Эндпоинты (через параметр ?action=):
  POST /auth?action=register       - Регистрация (отправка кода на email)
  POST /auth?action=verify-email   - Подтверждение email кодом
  POST /auth?action=login          - Вход в систему
  POST /auth?action=refresh        - Обновление токена
  POST /auth?action=logout         - Выход
  POST /auth?action=reset-password - Сброс пароля (отправка кода)
  GET  /auth?action=health         - Проверка БД
"""
from handlers import register, login, logout, refresh, reset_password, health, verify_email
from utils.http import options_response, error, get_origin_from_event


ROUTES = {
    'register': register.handle,
    'login': login.handle,
    'refresh': refresh.handle,
    'logout': logout.handle,
    'reset-password': reset_password.handle,
    'health': health.handle,
    'verify-email': verify_email.handle,
}

# Actions that allow GET method
GET_ACTIONS = {'health'}


def handler(event: dict, context) -> dict:
    """Main router for auth endpoints."""
    method = event.get('httpMethod', 'GET').upper()
    origin = get_origin_from_event(event)

    if method == 'OPTIONS':
        return options_response(origin)

    # Extract action from query parameters
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # Some actions allow GET
    if action in GET_ACTIONS and method == 'GET':
        return ROUTES[action](event, origin)

    if method != 'POST':
        return error(405, 'Method not allowed', origin)

    if not action or action not in ROUTES:
        return error(404, f'Unknown action: {action}. Use ?action=health|login|register|refresh|logout|reset-password|verify-email', origin)

    return ROUTES[action](event, origin)