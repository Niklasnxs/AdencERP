# FIX: PostgreSQL Password Authentication Failed

## Problem
```
psql: error: password authentication failed for user "adencerp"
```

## Solution

You need to either:
1. Find the correct password in your backend `.env` file, OR
2. Reset the database password

---

## OPTION 1: Find the Correct Password (Recommended)

On your server, check what password is configured:

```bash
cat /var/www/AdencERP/backend-service/.env | grep DB_PASSWORD
```

This will show you the password. Use that password when connecting to psql.

---

## OPTION 2: Reset the Database Password

If you don't remember the password or want to set a new one:

### Step 1: Connect as postgres superuser

```bash
sudo -u postgres psql
```

### Step 2: Reset the adencerp user password

```sql
ALTER USER adencerp WITH PASSWORD 'AdencERP2026!SecureDB';
\q
```

### Step 3: Update your backend .env file

```bash
nano /var/www/AdencERP/backend-service/.env
```

Make sure this line matches:
```
DB_PASSWORD=AdencERP2026!SecureDB
```

Save with `Ctrl+X`, `Y`, `Enter`

### Step 4: Restart backend service

```bash
pm2 restart adencerp-backend
```

---

## OPTION 3: Quick Fix - Use Postgres Superuser

If you just need to fix the passwords quickly:

```bash
sudo -u postgres psql adencerp
```

This connects as the postgres superuser (no password needed), then run:

```sql
-- Update admin password (password: admin123)
UPDATE users SET password = '$2b$10$4hBu7tQKsXoFiAqxfra5.ur8W1TNndCi/fE9tkdDByJoVDtIwVyV6' 
WHERE email = 'admin@adenc.de';

-- Update employee passwords (password: emp123)
UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'max.mueller@adenc.de';

UPDATE users SET password = '$2b$10$vaRMzk6LZl3PHUz2WAHR..184rc9UigH9/DnSiZRC.ECN/ZlbsaOG' 
WHERE email = 'anna.schmidt@adenc.de';

\q
```

Then try logging in at http://16.176.18.228 with:
- Email: `admin@adenc.de`
- Password: `admin123`

---

## Verify Database Connection

After fixing the password, test the connection:

```bash
# Method 1: With adencerp user
psql -U adencerp -d adencerp -h localhost
# Enter the password from backend-service/.env

# Method 2: With postgres superuser (always works)
sudo -u postgres psql adencerp
```

---

## Common Passwords to Try

Based on the deployment docs, try these:
1. `AdencERP2026!SecureDB` (recommended in docs)
2. `changeme` (default in .env.example)
3. `your_secure_password_123` (example in docs)

Check which one is in `/var/www/AdencERP/backend-service/.env`
