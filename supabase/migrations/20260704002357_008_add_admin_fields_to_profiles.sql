-- Add username column (nullable, for display)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Add role column (default 'user', can be 'admin')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add is_banned column (default false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Set username to name for existing rows
UPDATE profiles SET username = name WHERE username IS NULL;