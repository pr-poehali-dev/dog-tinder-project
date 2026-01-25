"""
Поддержка TinDog - чат с ассистентом Ариной
"""

import json
import os
from typing import Optional

import requests


PROVIDER_BASE_URL = "https://api.polza.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-4o-mini"
DEFAULT_TIMEOUT = 60


def get_cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def cors_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
        "isBase64Encoded": False,
    }


def options_response() -> dict:
    return {
        "statusCode": 204,
        "headers": get_cors_headers(),
        "body": "",
        "isBase64Encoded": False,
    }


def get_api_key() -> str:
    api_key = os.environ.get("POLZA_AI_API_KEY", "")
    if not api_key:
        raise ValueError("POLZA_AI_API_KEY not configured")
    return api_key


def make_request(endpoint: str, method: str = "POST", data: Optional[dict] = None) -> dict:
    api_key = get_api_key()
    url = f"{PROVIDER_BASE_URL}/{endpoint}"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        else:
            response = requests.post(url, headers=headers, json=data, timeout=DEFAULT_TIMEOUT)

        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise TimeoutError("API timeout")
    except requests.exceptions.ConnectionError:
        raise ConnectionError("API unavailable")
    except requests.exceptions.HTTPError as e:
        error_body = {}
        try:
            error_body = e.response.json()
        except Exception:
            pass
        raise ValueError(error_body.get("error", {}).get("message", str(e)))


def get_arina_answer(user_message: str, conversation_history: list = None) -> str:
    """Встроенная база знаний Арины с поддержкой контекста"""
    msg_lower = user_message.lower()
    
    if any(word in msg_lower for word in ['привет', 'здравствуй', 'добрый', 'здравствуйте']):
        return "Привет! 👋 Я Арина, ассистент поддержки TinDog. Помогу с вопросами о вязке собак, подготовке и работе платформы. Чем могу помочь?"
    
    if any(word in msg_lower for word in ['спасибо', 'благодарю', 'пасиб']):
        return "Всегда рада помочь! 😊 Если будут ещё вопросы — обращайтесь!"
    
    if any(word in msg_lower for word in ['пока', 'до свидания', 'досвидос']):
        return "До встречи! Удачи вам и вашему питомцу! 🐕💕"
    
    if 'когда' in msg_lower and ('вязать' in msg_lower or 'вязка' in msg_lower) and 'первый' in msg_lower:
        return """Отличный вопрос! 🐕

Суку рекомендуется вязать:
• Не раньше 2-й течки (обычно в 1,5-2 года)
• Оптимально — на 3-ю течку для крупных пород
• Кобеля можно вязать с 18-24 месяцев

Важно учитывать породу и готовность собаки. Лучше проконсультироваться с ветеринаром перед первой вязкой 👨‍⚕️"""
    
    if any(word in msg_lower for word in ['анализ', 'обследован', 'тест', 'проверк']):
        return """Перед вязкой обязательно нужны 🔬:

✅ Общий анализ крови
✅ Анализ на инфекции (хламидиоз, микоплазмоз)
✅ Мазок из влагалища (для сук)
✅ Проверка на генетические заболевания (для некоторых пород)

Также проверьте прививки и обработку от паразитов. На платформе можно заказать сопровождение ветеринара за 7500₽ 💉"""
    
    if 'как' in msg_lower and ('вязка' in msg_lower or 'процесс' in msg_lower or 'происходит' in msg_lower):
        return """Процесс вязки обычно проходит так 🐾:

1️⃣ Знакомство собак на нейтральной территории
2️⃣ Кобель делает садку на суку
3️⃣ Происходит "замок" (склещивание) на 10-40 минут
4️⃣ После разъединения собак держат отдельно 30 минут
5️⃣ Через 1-2 дня проводят контрольную вязку

Важно: не разъединяйте собак силой во время замка! Это естественный процесс 💕"""
    
    if any(word in msg_lower for word in ['не получ', 'неудач', 'не вышло', 'не сложи', 'провал', 'не случи']):
        return """Да, бывает, что вязка не получается с первого раза 😔

Причины могут быть разные:
• Неподходящий день течки (слишком рано или поздно)
• Стресс у собак, незнакомая обстановка
• Отсутствие опыта у одной или обеих собак
• Несовместимость по размеру
• Проблемы со здоровьем
• Агрессия или страх у суки/кобеля

Что делать:
✅ Повторить попытку через 1-2 дня
✅ Выбрать спокойное место без отвлекающих факторов
✅ Возможно, пригласить инструктора по вязке
✅ Сдать анализы на гормоны (для определения точного дня овуляции)

Не переживайте! Часто вторая попытка проходит успешно 🐕💕"""
    
    if 'алимент' in msg_lower or ('щенк' in msg_lower and 'оплат' in msg_lower):
        return """Алиментные щенки — это форма оплаты вязки 🐶

Владелец кобеля получает:
• 1 щенка из помёта (обычно первый выбор)
• Или 2-х щенков, если помёт большой

Вместо денежной оплаты. Всё обсуждается заранее и прописывается в договоре!"""
    
    if 'родословн' in msg_lower or 'ркф' in msg_lower or 'документ' in msg_lower:
        return """О документах РКФ 📋:

• Родословная РКФ нужна, если хотите продавать щенков с документами
• Без родословной вязка возможна, но щенки будут без документов
• На платформе можно заказать проверку документов за 500₽

Важно: обе собаки должны иметь родословную для регистрации помёта в РКФ ✅"""
    
    if any(word in msg_lower for word in ['партнёр', 'выбра', 'кандидат', 'подходящ']):
        return """При выборе партнёра обращайте внимание на 🔍:

✅ Порода и стандарт (должны совпадать)
✅ Здоровье и результаты анализов
✅ Темперамент и характер
✅ Отсутствие генетических заболеваний
✅ Успешные предыдущие вязки

На TinDog можно фильтровать кандидатов по всем параметрам!"""
    
    if any(word in msg_lower for word in ['платформ', 'работа', 'tindog', 'тиндог', 'сайт', 'приложен']):
        return """TinDog — платформа для поиска партнёров для вязки 💕

Как это работает:
1️⃣ Создаёте профиль своей собаки
2️⃣ Просматриваете анкеты других собак
3️⃣ Ставите лайки понравившимся кандидатам
4️⃣ При взаимной симпатии открывается чат
5️⃣ Договариваетесь о встрече и вязке

У нас есть проверка документов (500₽) и сопровождение ветеринара (7500₽)!"""
    
    if any(word in msg_lower for word in ['беремен', 'род', 'щен']):
        return """О беременности и родах 🤰:

• Беременность длится 58-63 дня
• Первые признаки: изменение аппетита, сонливость (3-4 неделя)
• УЗИ можно делать с 21-го дня
• К родам готовьте место, пелёнки, ножницы, нитки
• Лучше договориться с ветеринаром о дежурстве

Первые роды могут быть сложными — рекомендую сопровождение специалиста!"""
    
    if any(word in msg_lower for word in ['цена', 'стоимость', 'сколько', 'стоит']):
        return """Наши услуги 💰:

✅ Проверка документов — 500₽
  (проверяем родословную, паспорт, прививки)

✅ Сопровождение ветеринара — 7500₽
  (консультация, присутствие при вязке, помощь)

Использование платформы — бесплатно! Оплата только за дополнительные услуги."""
    
    if any(word in msg_lower for word in ['договор', 'юридич', 'закон', 'право']):
        return """О договорах и юридической стороне 📝:

• Рекомендую заключать письменный договор о вязке
• Укажите условия оплаты (деньги или алиментный щенок)
• Пропишите ответственность сторон
• Укажите сроки и место вязки

Договор защищает обе стороны от недопонимания!"""
    
    if any(word in msg_lower for word in ['течка', 'охота', 'день цикла', 'когда вязать']):
        return """О течке и оптимальном времени для вязки 📅:

• Течка длится 18-21 день
• Оптимальное время для вязки: 11-15 день от начала течки
• Признаки готовности: петля мягкая, выделения светлеют
• Сука подпускает кобеля, отводит хвост

Точное определение:
✅ Анализ на прогестерон (самый точный метод)
✅ Мазок из влагалища у ветеринара
✅ Наблюдение за поведением

Лучше проконсультироваться с ветеринаром для определения оптимального дня! 🔬"""
    
    if any(word in msg_lower for word in ['возраст', 'сколько лет', 'молод', 'стар']):
        return """О возрасте для вязки 🎂:

Сука:
• Первая вязка: не раньше 2-й течки (1,5-2 года)
• Оптимально: 3-я течка для крупных пород
• Последняя вязка: до 8-9 лет

Кобель:
• Первая вязка: 18-24 месяца
• Активное использование: до 10-12 лет

Важно учитывать:
• Физическую готовность собаки
• Породные особенности
• Здоровье и общее состояние

Слишком ранняя вязка может навредить здоровью! Консультируйтесь с ветеринаром 👨‍⚕️"""
    
    if any(word in msg_lower for word in ['сколько раз', 'как часто', 'интервал']):
        return """О частоте вязок 🔄:

Сука:
• Рекомендуется 1 раз в год (через течку)
• Максимум 2 раза в год (каждую течку)
• После родов минимум 6-8 месяцев перерыв

Кобель:
• Может вязаться чаще
• Оптимально: 1-2 раза в месяц
• Слишком частые вязки снижают качество спермы

Важно давать организму восстановиться! Частые роды изнашивают организм суки 💔"""
    
    if any(word in msg_lower for word in ['помощь', 'помоги', 'вопрос']):
        return """Я помогу с любыми вопросами о 🐕:

• Платформе TinDog
• Подготовке к вязке
• Выборе партнёра
• Документах и родословных
• Здоровье и анализах
• Беременности и родах
• Договорах между владельцами

Просто спрашивайте — отвечу!"""
    
    short_responses = {
        'да': 'Хорошо! Чем ещё могу помочь? 😊',
        'нет': 'Понятно. Если будут вопросы — обращайтесь!',
        'ок': 'Отлично! Если что-то ещё понадобится — пишите!',
        'понятно': 'Рада, что помогла! Есть ещё вопросы?',
        'ясно': 'Супер! Обращайтесь, если что! 👍',
        'хорошо': 'Здорово! Чем ещё помочь?'
    }
    
    for word, response in short_responses.items():
        if msg_lower.strip() == word:
            return response
    
    if len(user_message.split()) <= 3 and not any(c in user_message for c in '?!'):
        return f"Расскажите подробнее, пожалуйста! Что именно вас интересует по теме '{user_message}'? 😊"
    
    return """Понимаю вас! У меня есть информация по темам:
• Вязка собак и подготовка к ней
• Работа платформы TinDog
• Документы и родословные РКФ
• Здоровье питомца и анализы
• Беременность и роды
• Договоры между владельцами

Попробуйте переформулировать вопрос или задайте конкретный вопрос из этих тем. Я постараюсь помочь! 💕"""


def handle_generate(body: dict) -> dict:
    messages = body.get("messages", [])
    
    if not messages:
        return cors_response(400, {"error": "messages is required"})

    user_messages = [msg for msg in messages if msg.get("role") == "user"]
    if not user_messages:
        return cors_response(400, {"error": "No user message found"})
    
    last_user_message = user_messages[-1].get("content", "")
    answer = get_arina_answer(last_user_message)
    
    return cors_response(200, {
        "success": True,
        "content": answer,
        "model": "arina-kb-v1",
        "usage": {
            "prompt_tokens": len(last_user_message.split()),
            "completion_tokens": len(answer.split()),
            "total_tokens": len(last_user_message.split()) + len(answer.split()),
        },
        "finish_reason": "stop",
    })


def handle_models(body: dict) -> dict:
    return cors_response(200, {
        "success": True,
        "models": [{
            "id": "arina-kb-v1",
            "name": "Арина (встроенная база знаний)",
        }],
        "provider": "tindog-local",
    })


def handle_test(body: dict) -> dict:
    return cors_response(200, {
        "success": True,
        "message": "Arina knowledge base ready",
        "response": "Привет! Я Арина, готова помочь 👋",
        "model": "arina-kb-v1",
    })


def handler(event: dict, context) -> dict:
    """Чат с консультантом по вязке собак"""
    method = event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return options_response()

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    if not action:
        return cors_response(400, {"error": "action parameter is required"})

    body = {}
    if method == "POST":
        raw_body = event.get("body", "{}")
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            return cors_response(400, {"error": "Invalid JSON"})

    if action == "generate":
        return handle_generate(body)
    elif action == "models":
        return handle_models(body)
    elif action == "test":
        return handle_test(body)
    else:
        return cors_response(400, {"error": f"Unknown action: {action}"})