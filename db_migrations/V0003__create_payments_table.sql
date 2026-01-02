-- Таблица для платежей через Robokassa
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    robokassa_invoice_id VARCHAR(255),
    robokassa_transaction_id VARCHAR(255),
    pet_document_id INTEGER REFERENCES pet_documents(id),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_robokassa_invoice_id ON payments(robokassa_invoice_id);
CREATE INDEX idx_payments_pet_document_id ON payments(pet_document_id);