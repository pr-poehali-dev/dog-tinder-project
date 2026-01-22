ALTER TABLE t_p11971418_dog_tinder_project.users ADD COLUMN IF NOT EXISTS yandex_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_yandex_id ON t_p11971418_dog_tinder_project.users(yandex_id);

ALTER TABLE t_p11971418_dog_tinder_project.users ALTER COLUMN email SET DEFAULT '';
ALTER TABLE t_p11971418_dog_tinder_project.users ALTER COLUMN password_hash SET DEFAULT '';