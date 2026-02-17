-- Add separate email login fields for user mail client credentials
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_login TEXT,
ADD COLUMN IF NOT EXISTS email_password TEXT;
