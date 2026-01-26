CREATE TABLE IF NOT EXISTS t_p11971418_dog_tinder_project.breeding_processes (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    pet1_id INTEGER NOT NULL,
    pet2_id INTEGER NOT NULL,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    
    current_stage VARCHAR(50) NOT NULL DEFAULT 'planning',
    
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    location VARCHAR(20) NOT NULL CHECK (location IN ('male_home', 'neutral')),
    address TEXT,
    
    with_vet BOOLEAN NOT NULL DEFAULT FALSE,
    vet_id INTEGER,
    vet_name VARCHAR(255),
    vet_clinic VARCHAR(255),
    vet_paid BOOLEAN DEFAULT FALSE,
    
    stages_completed JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    CONSTRAINT check_stage CHECK (current_stage IN ('planning', 'acquaintance', 'first_mating', 'control_mating', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_breeding_processes_chat ON t_p11971418_dog_tinder_project.breeding_processes(chat_id);
CREATE INDEX IF NOT EXISTS idx_breeding_processes_users ON t_p11971418_dog_tinder_project.breeding_processes(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_breeding_processes_stage ON t_p11971418_dog_tinder_project.breeding_processes(current_stage);