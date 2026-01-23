-- Создаем взаимные лайки между Юджином (id=1) и Рексом (id=3)
INSERT INTO t_p11971418_dog_tinder_project.pet_likes (from_pet_id, to_pet_id)
VALUES (1, 3);

INSERT INTO t_p11971418_dog_tinder_project.pet_likes (from_pet_id, to_pet_id)
VALUES (3, 1);

-- Создаем матч
INSERT INTO t_p11971418_dog_tinder_project.pet_matches (pet1_id, pet2_id)
VALUES (1, 3);

-- Получаем ID матча и создаем чат
INSERT INTO t_p11971418_dog_tinder_project.chats (match_id)
VALUES ((SELECT id FROM t_p11971418_dog_tinder_project.pet_matches WHERE pet1_id = 1 AND pet2_id = 3));

-- Добавляем тестовые сообщения
INSERT INTO t_p11971418_dog_tinder_project.chat_messages (chat_id, sender_user_id, message)
VALUES (
  (SELECT id FROM t_p11971418_dog_tinder_project.chats WHERE match_id = (SELECT id FROM t_p11971418_dog_tinder_project.pet_matches WHERE pet1_id = 1 AND pet2_id = 3)),
  1,
  'Привет! Какой красивый пёсик! Может погуляем вместе?'
);

INSERT INTO t_p11971418_dog_tinder_project.chat_messages (chat_id, sender_user_id, message)
VALUES (
  (SELECT id FROM t_p11971418_dog_tinder_project.chats WHERE match_id = (SELECT id FROM t_p11971418_dog_tinder_project.pet_matches WHERE pet1_id = 1 AND pet2_id = 3)),
  2,
  'Здравствуйте! Спасибо! С удовольствием, когда вам удобно?'
);

INSERT INTO t_p11971418_dog_tinder_project.chat_messages (chat_id, sender_user_id, message)
VALUES (
  (SELECT id FROM t_p11971418_dog_tinder_project.chats WHERE match_id = (SELECT id FROM t_p11971418_dog_tinder_project.pet_matches WHERE pet1_id = 1 AND pet2_id = 3)),
  1,
  'Завтра в парке Горького в 17:00? 🐕'
);
