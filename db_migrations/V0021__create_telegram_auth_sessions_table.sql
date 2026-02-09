-- Создание таблицы для хранения сессий Telegram авторизации
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.telegram_auth_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_telegram_auth_sessions_user_id ON t_p11971418_dog_tinder_project.telegram_auth_sessions(user_id);

-- Индекс для автоматической очистки устаревших сессий
CREATE INDEX IF NOT EXISTS idx_telegram_auth_sessions_expires_at ON t_p11971418_dog_tinder_project.telegram_auth_sessions(expires_at);
