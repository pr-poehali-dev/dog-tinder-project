-- Add unique constraint on username
ALTER TABLE t_p11971418_dog_tinder_project.users 
ADD CONSTRAINT users_username_unique UNIQUE (username);