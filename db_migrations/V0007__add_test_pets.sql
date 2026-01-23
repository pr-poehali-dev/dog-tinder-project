-- Добавляем тестовых питомцев для демонстрации чатов

-- Питомец для пользователя 1
INSERT INTO t_p11971418_dog_tinder_project.pets (user_id, name, species, breed, age, gender, city, description, photo_url)
VALUES (
  1, 
  'Рекс', 
  'dog',
  'Немецкая овчарка', 
  3, 
  'male', 
  'Москва', 
  'Активный и дружелюбный пес, любит долгие прогулки и игры',
  'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800'
);

-- Питомец для пользователя 3
INSERT INTO t_p11971418_dog_tinder_project.pets (user_id, name, species, breed, age, gender, city, description, photo_url)
VALUES (
  3, 
  'Белла', 
  'dog',
  'Лабрадор', 
  2, 
  'female', 
  'Москва', 
  'Нежная и умная собака, обожает детей и других животных',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
);
