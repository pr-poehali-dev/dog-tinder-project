-- Добавление поля authenticated в таблицу telegram_auth_sessions
ALTER TABLE t_p11971418_dog_tinder_project.telegram_auth_sessions 
ADD COLUMN IF NOT EXISTS authenticated BOOLEAN DEFAULT FALSE;
