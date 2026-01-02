-- Таблицы для объявлений о питомцах и документов
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20),
    description TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pet_documents (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id),
    user_id INTEGER REFERENCES users(id),
    document_type VARCHAR(100) NOT NULL,
    document_url TEXT NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verification_payment_id INTEGER,
    verified_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_is_active ON pets(is_active);
CREATE INDEX idx_pet_documents_pet_id ON pet_documents(pet_id);
CREATE INDEX idx_pet_documents_user_id ON pet_documents(user_id);