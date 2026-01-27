-- Migration: Add employee information fields
-- Date: 2026-01-27
-- Description: Add address, birthday, and employment_type to users table

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'internship', 'minijob'));

-- Create index for birthday queries (useful for birthday reminders, age calculations)
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday);

-- Update existing users with default values if needed (optional)
-- COMMENT: Existing users will have NULL values for these fields until updated by admin
