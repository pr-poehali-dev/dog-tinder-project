-- Add column to track last username change
ALTER TABLE t_p11971418_dog_tinder_project.users 
ADD COLUMN username_updated_at TIMESTAMP DEFAULT NULL;