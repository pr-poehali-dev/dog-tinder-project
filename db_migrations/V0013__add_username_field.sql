-- Добавляем username (пока необязательное)
ALTER TABLE t_p11971418_dog_tinder_project.users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Создаём уникальный индекс для username (игнорируя NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique 
ON t_p11971418_dog_tinder_project.users(username) 
WHERE username IS NOT NULL;

-- Генерируем username для существующих пользователей (из email до @)
UPDATE t_p11971418_dog_tinder_project.users 
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
WHERE username IS NULL AND email IS NOT NULL AND email != '';

-- Если username получился пустым или дублируется, добавляем id
UPDATE t_p11971418_dog_tinder_project.users 
SET username = 'user' || id 
WHERE username IS NULL OR username = '';