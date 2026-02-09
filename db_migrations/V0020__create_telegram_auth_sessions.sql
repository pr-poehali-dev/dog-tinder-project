-- Создание таблицы для сессий авторизации через Telegram
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.telegram_auth_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    telegram_id VARCHAR(64) NOT NULL,
    chat_id BIGINT,
    user_id INTEGER,
    authenticated_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_sessions_telegram_id ON t_p11971418_dog_tinder_project.telegram_auth_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_sessions_session_id ON t_p11971418_dog_tinder_project.telegram_auth_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_telegram_auth_sessions_expires_at ON t_p11971418_dog_tinder_project.telegram_auth_sessions(expires_at);