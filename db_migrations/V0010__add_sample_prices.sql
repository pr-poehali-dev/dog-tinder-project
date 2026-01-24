-- Добавляем тестовые цены для существующих питомцев
UPDATE t_p11971418_dog_tinder_project.pets 
SET breeding_price = 15000 
WHERE id IN (1, 3, 5);

UPDATE t_p11971418_dog_tinder_project.pets 
SET breeding_price = 20000 
WHERE id IN (4, 6);
