-- Fix user passwords in existing database
-- Run this on the server if login is failing with "Invalid credentials"

-- Update admin password (password: Adence#123)
UPDATE users SET password = '$2b$10$cmhKIeDmeHMzfld563gqkOYXsJas8k8s.tVcV1aInyIYc3lu2j2US' 
WHERE email = 'niklas.schindhelm@adence.de';

-- Verify changes
SELECT id, email, full_name, role, 
       substring(password from 1 for 20) as password_hash_preview
FROM users
ORDER BY id;
