ALTER TABLE t_p11971418_dog_tinder_project.pets 
ADD COLUMN rank VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN passport_verified BOOLEAN DEFAULT false,
ADD COLUMN verification_paid BOOLEAN DEFAULT false,
ADD COLUMN verification_paid_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.pet_documents_storage (
  id SERIAL PRIMARY KEY,
  pet_id INTEGER NOT NULL REFERENCES t_p11971418_dog_tinder_project.pets(id),
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE t_p11971418_dog_tinder_project.pets IS 'Объявления о питомцах';
COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.rank IS 'Ранг/титул питомца';
COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.city IS 'Город нахождения';
COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.passport_verified IS 'Документы проверены';
COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.verification_paid IS 'Оплачена проверка документов';
COMMENT ON COLUMN t_p11971418_dog_tinder_project.pets.verification_paid_at IS 'Дата оплаты проверки';