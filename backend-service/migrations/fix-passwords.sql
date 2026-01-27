-- Fix user passwords in existing database
-- Run this on the server if login is failing with "Invalid credentials"

-- Update admin password (password: admin123)
UPDATE users SET password = '$2b$10$4hBu7tQKsXoFiAqxfra5.ur8W1TNndCi/fE9tkdDByJoVDtIwVyV6' 
WHERE email = 'admin@adenc.de';

-- Update employee passwords (password: emp123)
UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'max.mueller@adenc.de';

UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'anna.schmidt@adenc.de';

-- Verify changes
SELECT id, email, full_name, role, 
       substring(password from 1 for 20) as password_hash_preview
FROM users
ORDER BY id;
