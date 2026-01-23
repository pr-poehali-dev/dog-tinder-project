-- Таблица лайков между питомцами
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.pet_likes (
    id SERIAL PRIMARY KEY,
    from_pet_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pets(id),
    to_pet_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pets(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_pet_id, to_pet_id)
);

-- Таблица матчей (взаимных лайков)
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.pet_matches (
    id SERIAL PRIMARY KEY,
    pet1_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pets(id),
    pet2_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pets(id),
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pet1_id, pet2_id)
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.chats (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pet_matches(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений в чатах
CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.chats(id),
    sender_user_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_pet_likes_from ON t_p11971418_dog_tinder_project.pet_likes(from_pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_likes_to ON t_p11971418_dog_tinder_project.pet_likes(to_pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_matches_pet1 ON t_p11971418_dog_tinder_project.pet_matches(pet1_id);
CREATE INDEX IF NOT EXISTS idx_pet_matches_pet2 ON t_p11971418_dog_tinder_project.pet_matches(pet2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON t_p11971418_dog_tinder_project.chat_messages(chat_id);
