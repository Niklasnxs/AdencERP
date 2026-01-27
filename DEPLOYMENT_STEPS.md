# Deployment Steps for Employee Info Feature (Server 16.176.18.228)

## Step 1: Check Current Setup

SSH into your server and check the setup:

```bash
ssh ubuntu@16.176.18.228

# Check if code directory exists
cd /var/www/AdencERP
pwd

# Check what's running
pm2 list
# OR
systemctl list-units | grep adenc

# Check PostgreSQL is running
sudo systemctl status postgresql
```

## Step 2: Pull Latest Code

```bash
cd /var/www/AdencERP
git pull origin main
```

You should see the new files being downloaded including:
- `backend-service/migrations/add-employee-info.sql`
- `EMPLOYEE_INFO_MIGRATION.md`

## Step 3: Check Database Connection Info

Find your database credentials:

```bash
# Check backend .env file
cat backend-service/.env

# You should see something like:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=adencerp
# DB_USER=adencerp_user
# DB_PASSWORD=your_password
```

## Step 4: Run Database Migration

Option A - Using psql directly:
```bash
# Use the credentials from your .env file
sudo -u postgres psql -d adencerp -f backend-service/migrations/add-employee-info.sql
```

Option B - If you have a specific user:
```bash
# Replace with your actual DB_USER from .env
psql -h localhost -U adencerp_user -d adencerp -f backend-service/migrations/add-employee-info.sql
```

Option C - Using the migrations runner:
```bash
cd backend-service
node migrations/run.js
```

### Verify Migration:
```bash
sudo -u postgres psql -d adencerp -c "\d users"
```

You should see the new columns:
- address | text
- birthday | date  
- employment_type | character varying(50)

## Step 5: Restart Backend Service

Find how your backend is running:

```bash
# Check PM2
pm2 list

# If you see it, restart with:
pm2 restart <process-name>

# OR check systemd
sudo systemctl list-units | grep -i backend

# If it's a systemd service:
sudo systemctl restart adencerp-backend
# or whatever the service name is

# OR if it's just node running:
# Find the process
ps aux | grep node

# Kill and restart
pkill -f "node.*server.js"
cd /var/www/AdencERP/backend-service
nohup node server.js > ../backend.log 2>&1 &
```

## Step 6: Rebuild Frontend

```bash
cd /var/www/AdencERP

# Install dependencies (if needed)
npm install

# Build frontend
npm run build

# The build output goes to dist/ folder
# Make sure your web server (nginx/apache) is serving from there
```

## Step 7: Verify Deployment

1. **Check backend is running:**
```bash
curl http://localhost:3002/api/health
# Should return: {"status":"ok","service":"adencerp-backend"}
```

2. **Check logs:**
```bash
# PM2 logs
pm2 logs

# OR systemd logs
sudo journalctl -u adencerp-backend -f

# OR file logs
tail -f /var/www/AdencERP/backend.log
```

3. **Test in browser:**
- Go to http://16.176.18.228 (or your domain)
- Login as admin
- Go to Users page
- Click "Neuer Benutzer" or edit existing user
- You should see new fields: **Address, Birthday, Employment Type**

## Troubleshooting

### Issue: "Peer authentication failed"
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Change this line:
local   all             all                                     peer

# To:
local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue: "PM2 not found"
Your backend might not be using PM2. Check:
```bash
ps aux | grep node
sudo systemctl list-units | grep -i adenc
```

### Issue: Frontend not updating
```bash
# Clear nginx cache (if using nginx)
sudo systemctl restart nginx

# Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Issue: Database columns not added
```bash
# Manually add the columns
sudo -u postgres psql -d adencerp

# In psql:
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'internship', 'minijob'));
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday);

# Exit psql
\q
```

## Need Help?

If you're stuck, run this diagnostic script:

```bash
cd /var/www/AdencERP

echo "=== Directory Structure ==="
ls -la

echo "=== Git Status ==="
git status
git log --oneline -5

echo "=== Backend .env ==="
cat backend-service/.env | grep -v PASSWORD

echo "=== Running Processes ==="
pm2 list
ps aux | grep node

echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql

echo "=== Database Tables ==="
sudo -u postgres psql -d adencerp -c "\dt"
```

Send me the output and I can help diagnose the issue!
