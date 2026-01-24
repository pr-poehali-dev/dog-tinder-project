-- Добавление поля для цены за вязку
ALTER TABLE t_p11971418_dog_tinder_project.pets 
ADD COLUMN breeding_price INTEGER NULL;

COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.breeding_price IS 'Цена за вязку в рублях';