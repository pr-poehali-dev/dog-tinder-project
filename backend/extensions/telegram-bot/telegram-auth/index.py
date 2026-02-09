"""
Telegram Auth Extension - Backend Function

Authentication via Telegram bot with temporary token approach.
Flow:
1. User clicks "Login via Telegram" -> redirect to bot
2. Bot generates unique auth link and sends to user
3. User clicks link -> frontend exchanges token for JWT
4. Refresh tokens stored hashed (SHA256) in DB
"""

import json
import os
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
import psycopg2
import jwt


# =============================================================================
# CONFIGURATION
# =============================================================================

def get_db_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return f"{schema}." if schema else ""


def get_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise ValueError(f"Missing environment variable: {key}")
    return value


# =============================================================================
# SECURITY HELPERS
# =============================================================================

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def create_jwt(user_id: int, secret: str, expires_in: int = 900) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def get_auth_token(cursor, token: str) -> Optional[dict]:
    """Get auth token data by token."""
    token_hash = hash_token(token)
    schema = get_schema()

    cursor.execute(f"""
        SELECT telegram_id, telegram_username, telegram_first_name,
               telegram_last_name, telegram_photo_url, expires_at, used
        FROM {schema}telegram_auth_tokens
        WHERE token_hash = %s
    """, (token_hash,))

    row = cursor.fetchone()
    if not row:
        return None

    return {
        "telegram_id": row[0],
        "telegram_username": row[1],
        "telegram_first_name": row[2],
        "telegram_last_name": row[3],
        "telegram_photo_url": row[4],
        "expires_at": row[5],
        "used": row[6],
    }


def mark_token_used(cursor, token: str) -> bool:
    """Mark token as used."""
    token_hash = hash_token(token)
    schema = get_schema()

    cursor.execute(f"""
        UPDATE {schema}telegram_auth_tokens
        SET used = TRUE
        WHERE token_hash = %s AND used = FALSE
        RETURNING id
    """, (token_hash,))

    return cursor.fetchone() is not None


def cleanup_expired_tokens(cursor) -> None:
    """Remove expired auth tokens."""
    schema = get_schema()
    cursor.execute(f"""
        DELETE FROM {schema}telegram_auth_tokens
        WHERE expires_at < NOW() OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour')
    """)


def find_user_by_telegram_id(cursor, telegram_id: str) -> Optional[dict]:
    """Find user by Telegram ID."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT id, email, name, avatar_url, telegram_id
        FROM {schema}users
        WHERE telegram_id = %s
    """, (telegram_id,))

    row = cursor.fetchone()
    if row:
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "avatar_url": row[3],
            "telegram_id": row[4],
        }
    return None


def generate_unique_username(cursor, base_username: str, telegram_id: str) -> str:
    """Generate unique username based on telegram username or id."""
    schema = get_schema()
    
    # Clean base username
    if base_username:
        username = base_username.lower().replace('@', '')
        username = ''.join(c for c in username if c.isalnum() or c == '_')
    else:
        username = f"tg{telegram_id}"
    
    # Check if username is available
    original_username = username
    counter = 1
    
    while True:
        cursor.execute(f"""
            SELECT id FROM {schema}users WHERE username = %s
        """, (username,))
        
        if cursor.fetchone() is None:
            return username
        
        # Username taken, try with number
        username = f"{original_username}{counter}"
        counter += 1
        
        if counter > 100:  # Safety limit
            username = f"tg{telegram_id}_{secrets.token_hex(4)}"
            break
    
    return username


def create_or_update_user(
    cursor,
    telegram_id: str,
    username: Optional[str],
    first_name: Optional[str],
    last_name: Optional[str],
    photo_url: Optional[str],
    phone: Optional[str] = None
) -> dict:
    """Create new user or update existing one."""
    schema = get_schema()

    # Build display name
    name_parts = []
    if first_name:
        name_parts.append(first_name)
    if last_name:
        name_parts.append(last_name)
    display_name = " ".join(name_parts) if name_parts else username or f"User {telegram_id}"

    # Check if user exists
    existing = find_user_by_telegram_id(cursor, telegram_id)

    if existing:
        # Update existing user
        cursor.execute(f"""
            UPDATE {schema}users
            SET name = COALESCE(%s, name),
                avatar_url = COALESCE(%s, avatar_url),
                phone = COALESCE(%s, phone),
                last_login_at = NOW(),
                updated_at = NOW()
            WHERE telegram_id = %s
            RETURNING id, email, name, avatar_url, telegram_id, username, phone
        """, (display_name, photo_url, phone, telegram_id))
    else:
        # Create new user WITHOUT username (user will set it manually)
        cursor.execute(f"""
            INSERT INTO {schema}users (telegram_id, username, name, phone, avatar_url, email, email_verified, password_hash, created_at, updated_at, last_login_at)
            VALUES (%s, NULL, %s, %s, %s, '', TRUE, '', NOW(), NOW(), NOW())
            RETURNING id, email, name, avatar_url, telegram_id, username, phone
        """, (telegram_id, display_name, phone, photo_url))

    row = cursor.fetchone()
    return {
        "id": row[0],
        "email": row[1],
        "name": row[2],
        "avatar_url": row[3],
        "telegram_id": row[4],
        "username": row[5],
        "phone": row[6],
    }


def save_refresh_token(cursor, user_id: int, token_hash: str, expires_at: datetime) -> None:
    """Save hashed refresh token to DB."""
    schema = get_schema()
    cursor.execute(f"""
        INSERT INTO {schema}refresh_tokens (user_id, token_hash, expires_at)
        VALUES (%s, %s, %s)
    """, (user_id, token_hash, expires_at))


def find_refresh_token(cursor, token_hash: str) -> Optional[dict]:
    """Find refresh token by hash."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT user_id, expires_at
        FROM {schema}refresh_tokens
        WHERE token_hash = %s AND expires_at > NOW()
    """, (token_hash,))

    row = cursor.fetchone()
    if row:
        return {"user_id": row[0], "expires_at": row[1]}
    return None


def delete_refresh_token(cursor, token_hash: str) -> None:
    """Delete refresh token."""
    schema = get_schema()
    cursor.execute(f"DELETE FROM {schema}refresh_tokens WHERE token_hash = %s", (token_hash,))


def get_user_by_id(cursor, user_id: int) -> Optional[dict]:
    """Get user by ID."""
    schema = get_schema()
    cursor.execute(f"""
        SELECT id, email, name, avatar_url, telegram_id, username
        FROM {schema}users WHERE id = %s
    """, (user_id,))

    row = cursor.fetchone()
    if row:
        return {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "avatar_url": row[3],
            "telegram_id": row[4],
            "username": row[5],
        }
    return None


def cleanup_expired_refresh_tokens(cursor) -> None:
    """Remove expired refresh tokens."""
    schema = get_schema()
    cursor.execute(f"DELETE FROM {schema}refresh_tokens WHERE expires_at < NOW()")


# =============================================================================
# CORS HELPERS
# =============================================================================

def get_cors_headers() -> dict:
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    return {
        "Access-Control-Allow-Origin": allowed_origins,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def cors_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def options_response() -> dict:
    return {
        "statusCode": 204,
        "headers": get_cors_headers(),
        "body": "",
    }


# =============================================================================
# ACTION HANDLERS
# =============================================================================

def handle_callback(cursor, body: dict) -> dict:
    """
    POST ?action=callback
    Frontend calls this with token to exchange for JWT.
    Like standard OAuth callback.
    """
    token = body.get("token")
    phone = body.get("phone")  # Получаем телефон из запроса
    
    print(f"[DEBUG] handle_callback called with token={token}, phone={phone}")
    
    if not token:
        print("[ERROR] Missing token in request")
        return cors_response(400, {"error": "Missing token"})

    token_data = get_auth_token(cursor, token)
    print(f"[DEBUG] token_data from DB: {token_data}")

    if not token_data:
        print("[ERROR] Token not found in database")
        return cors_response(404, {"error": "Token not found"})

    # Check if expired (handle both naive and aware datetime from DB)
    expires_at = token_data["expires_at"]
    now = datetime.now(timezone.utc)
    # Convert to naive UTC for comparison if needed
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        print(f"[ERROR] Token expired: expires_at={expires_at}, now={now}")
        return cors_response(410, {"error": "Token expired"})

    # Check if already used
    if token_data["used"]:
        print("[ERROR] Token already used")
        return cors_response(410, {"error": "Token already used"})

    # Check if user data exists
    if not token_data["telegram_id"]:
        print("[ERROR] Token not authenticated - no telegram_id")
        return cors_response(400, {"error": "Token not authenticated"})

    # Get JWT secret
    jwt_secret = get_env("JWT_SECRET")
    if len(jwt_secret) < 32:
        return cors_response(500, {"error": "Server configuration error"})

    # Create or update user
    print(f"[DEBUG] Creating/updating user with telegram_id={token_data['telegram_id']}, phone={phone}")
    user = create_or_update_user(
        cursor,
        telegram_id=token_data["telegram_id"],
        username=token_data["telegram_username"],
        first_name=token_data["telegram_first_name"],
        last_name=token_data["telegram_last_name"],
        photo_url=token_data["telegram_photo_url"],
        phone=phone  # Передаём телефон
    )
    print(f"[DEBUG] User created/updated: {user}")

    # Mark token as used
    mark_token_used(cursor, token)

    # If new user without username - ask to set it
    if not user['username']:
        print(f"[INFO] User needs username: user_id={user['id']}")
        return cors_response(200, {
            'needs_username': True,
            'user_id': user['id'],
            'user': user
        })

    # Generate tokens
    access_token = create_jwt(user["id"], jwt_secret)
    refresh_token = generate_token(48)
    refresh_token_hash = hash_token(refresh_token)
    refresh_expires = datetime.now(timezone.utc) + timedelta(days=30)

    save_refresh_token(cursor, user["id"], refresh_token_hash, refresh_expires)
    
    print(f"[SUCCESS] Auth completed for user_id={user['id']}")
    return cors_response(200, {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,
        "user": user,
    })


def handle_refresh(cursor, body: dict) -> dict:
    """
    POST ?action=refresh
    Refresh access token using refresh token.
    """
    refresh_token = body.get("refresh_token")
    if not refresh_token:
        return cors_response(400, {"error": "Missing refresh_token"})

    jwt_secret = get_env("JWT_SECRET")
    token_hash = hash_token(refresh_token)

    token_data = find_refresh_token(cursor, token_hash)
    if not token_data:
        return cors_response(401, {"error": "Invalid or expired refresh token"})

    user = get_user_by_id(cursor, token_data["user_id"])
    if not user:
        return cors_response(401, {"error": "User not found"})

    # Generate new access token
    access_token = create_jwt(user["id"], jwt_secret)

    return cors_response(200, {
        "access_token": access_token,
        "expires_in": 900,
        "user": user,
    })


def handle_set_username(cursor, body: dict) -> dict:
    """
    POST ?action=set_username
    Set or update username for user.
    """
    user_id = body.get('user_id')
    new_username = body.get('username', '').strip().lower()
    
    if not user_id or not new_username:
        return cors_response(400, {'error': 'Missing user_id or username'})
    
    # Validate username format
    if not new_username.replace('_', '').isalnum():
        return cors_response(400, {'error': 'Username can only contain letters, numbers, and underscores'})
    
    if len(new_username) < 3 or len(new_username) > 30:
        return cors_response(400, {'error': 'Username must be between 3 and 30 characters'})
    
    schema = get_schema()
    
    # Check if user exists and get current username data
    cursor.execute(f"SELECT username, username_updated_at FROM {schema}users WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    
    if not user_data:
        return cors_response(400, {'error': 'User not found'})
    
    current_username, username_updated_at = user_data
    
    # Check 30-day limit for username change (only if changing existing username)
    if current_username and username_updated_at:
        now = datetime.now(timezone.utc)
        if username_updated_at.tzinfo is None:
            username_updated_at = username_updated_at.replace(tzinfo=timezone.utc)
        
        days_since_update = (now - username_updated_at).days
        
        if days_since_update < 30:
            days_remaining = 30 - days_since_update
            return cors_response(400, {'error': f'Username can be changed in {days_remaining} days'})
    
    # Check if username is already taken by another user
    cursor.execute(f"SELECT id FROM {schema}users WHERE username = %s AND id != %s", (new_username, user_id))
    if cursor.fetchone():
        return cors_response(400, {'error': 'Username already taken'})
    
    # Update user with new username and timestamp
    cursor.execute(f"""
        UPDATE {schema}users
        SET username = %s, username_updated_at = NOW(), updated_at = NOW()
        WHERE id = %s
        RETURNING id, email, name, avatar_url, telegram_id, username, phone, username_updated_at
    """, (new_username, user_id))
    
    row = cursor.fetchone()
    if not row:
        return cors_response(400, {'error': 'User not found'})
    
    user = {
        "id": row[0],
        "email": row[1],
        "name": row[2],
        "avatar_url": row[3],
        "telegram_id": row[4],
        "username": row[5],
        "phone": row[6],
        "username_updated_at": row[7].isoformat() if row[7] else None,
    }
    
    # Generate tokens
    jwt_secret = get_env('JWT_SECRET')
    access_token = create_jwt(user['id'], jwt_secret, expires_in=900)
    refresh_token = generate_token(48)
    refresh_token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    save_refresh_token(cursor, user['id'], refresh_token_hash, expires_at)
    
    return cors_response(200, {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user
    })


def handle_check_username(cursor, body: dict) -> dict:
    """
    POST ?action=check_username
    Check if username is available.
    """
    username = body.get('username', '').strip().lower()
    
    if not username:
        return cors_response(400, {'error': 'Username is required'})
    
    if len(username) < 3:
        return cors_response(200, {'available': False, 'message': 'Minimum 3 characters'})
    
    schema = get_schema()
    cursor.execute(f"SELECT id FROM {schema}users WHERE LOWER(username) = %s", (username,))
    exists = cursor.fetchone()
    
    return cors_response(200, {
        'available': not exists,
        'message': 'Username available' if not exists else 'Username taken'
    })


def handle_generate_username(cursor, body: dict) -> dict:
    """
    POST ?action=generate_username
    Generate unique username.
    """
    telegram_username = body.get('telegram_username', '')
    telegram_id = body.get('telegram_id', '')
    
    base = telegram_username if telegram_username else f"user{telegram_id}"
    username = generate_unique_username(cursor, base, telegram_id or str(secrets.randbits(32)))
    
    return cors_response(200, {'username': username})


def handle_logout(cursor, body: dict) -> dict:
    """
    POST ?action=logout
    Invalidate refresh token.
    """
    refresh_token = body.get("refresh_token")
    if refresh_token:
        token_hash = hash_token(refresh_token)
        delete_refresh_token(cursor, token_hash)

    return cors_response(200, {"success": True})


def handle_get_bot_username() -> dict:
    """
    GET ?action=bot-username
    Return bot username from environment.
    """
    bot_username = os.environ.get("TELEGRAM_BOT_USERNAME", "")
    if not bot_username:
        return cors_response(500, {"error": "Bot username not configured"})
    
    return cors_response(200, {"bot_username": bot_username})


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event, context):
    """Main entry point."""
    method = event.get("httpMethod", "GET")

    # Handle CORS preflight
    if method == "OPTIONS":
        return options_response()

    # Parse query params
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # Parse body for POST requests
    body = {}
    if method == "POST":
        raw_body = event.get("body", "{}")
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            return cors_response(400, {"error": "Invalid JSON"})

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Cleanup expired tokens periodically
        cleanup_expired_tokens(cursor)
        cleanup_expired_refresh_tokens(cursor)

        # Route to action handler
        if action == "callback" and method == "POST":
            response = handle_callback(cursor, body)
        elif action == "set_username" and method == "POST":
            response = handle_set_username(cursor, body)
        elif action == "check_username" and method == "POST":
            response = handle_check_username(cursor, body)
        elif action == "generate_username" and method == "POST":
            response = handle_generate_username(cursor, body)
        elif action == "refresh" and method == "POST":
            response = handle_refresh(cursor, body)
        elif action == "logout" and method == "POST":
            response = handle_logout(cursor, body)
        elif action == "bot-username" and method == "GET":
            return handle_get_bot_username()
        else:
            response = cors_response(400, {"error": f"Unknown action: {action}"})

        conn.commit()
        return response

    except ValueError as e:
        return cors_response(500, {"error": "Server configuration error"})
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {e}")
        return cors_response(500, {"error": "Internal server error"})
    finally:
        if conn:
            conn.close()