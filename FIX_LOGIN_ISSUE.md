# FIX: Login Fails with "Invalid credentials"

## Problem

You see these errors in the browser console:
```
POST http://16.176.18.228/api/auth/login 401 (Unauthorized)
Login failed: Error: Invalid credentials
```

## Root Cause

The database has placeholder password hashes that don't match the actual passwords for the default users.

## Solution

SSH into your server and run these commands to fix the user passwords:

---

## STEP 1: SSH into Server

```bash
ssh ubuntu@16.176.18.228
```

---

## STEP 2: Connect to PostgreSQL Database

```bash
psql -U adencerp -d adencerp -h localhost
```

**Enter password:** `AdencERP2026!SecureDB` (or whatever you set in backend-service/.env)

---

## STEP 3: Update User Passwords

Copy and paste these SQL commands:

```sql
-- Update admin password (password: admin123)
UPDATE users SET password = '$2b$10$4hBu7tQKsXoFiAqxfra5.ur8W1TNndCi/fE9tkdDByJoVDtIwVyV6' 
WHERE email = 'admin@adenc.de';

-- Update employee passwords (password: emp123)
UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'max.mueller@adenc.de';

UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'anna.schmidt@adenc.de';
```

**Expected output:**
```
UPDATE 1
UPDATE 1
UPDATE 1
```

---

## STEP 4: Verify Changes

```sql
SELECT id, email, full_name, role FROM users;
```

**Expected output:**
```
 id |          email          |   full_name   |   role   
----+-------------------------+---------------+----------
  1 | admin@adenc.de          | Admin User    | admin
  2 | max.mueller@adenc.de    | Max Müller    | employee
  3 | anna.schmidt@adenc.de   | Anna Schmidt  | employee
```

Type `\q` to exit psql.

---

## STEP 5: Test Login

Go to http://16.176.18.228 and try logging in:

### Admin Login:
- **Email:** admin@adenc.de
- **Password:** admin123

### Employee Login:
- **Email:** max.mueller@adenc.de
- **Password:** emp123

---

## Alternative Method: Run Fix Script from File

If you prefer to run a SQL file:

```bash
cd /var/www/AdencERP/backend-service/migrations
psql -U adencerp -d adencerp -h localhost -f fix-passwords.sql
```

---

## Future Deployments

The password hashes have been fixed in the `schema.sql` file, so future deployments will have the correct passwords automatically.

If you need to re-run migrations (WARNING: this will delete all data):

```bash
cd /var/www/AdencERP/backend-service

# Drop and recreate database
sudo -u postgres psql << 'EOF'
DROP DATABASE IF EXISTS adencerp;
CREATE DATABASE adencerp;
GRANT ALL PRIVILEGES ON DATABASE adencerp TO adencerp;
\c adencerp
GRANT ALL ON SCHEMA public TO adencerp;
EOF

# Re-run migrations
npm run migrate
```

---

## Default User Credentials

After fix, these are the default credentials:

| Email | Password | Role |
|-------|----------|------|
| admin@adenc.de | admin123 | admin |
| max.mueller@adenc.de | emp123 | employee |
| anna.schmidt@adenc.de | emp123 | employee |

⚠️ **Remember to change these passwords in production!**
