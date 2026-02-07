-- Add access links columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_access TEXT,
ADD COLUMN IF NOT EXISTS mattermost_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT;
