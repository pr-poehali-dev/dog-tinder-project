-- Добавляем поле vk_id для авторизации через ВКонтакте
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_id VARCHAR(50);

-- Создаем индекс для быстрого поиска по vk_id
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users(vk_id);