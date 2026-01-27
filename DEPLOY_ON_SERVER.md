# EXACT DEPLOYMENT INSTRUCTIONS FOR SERVER 3.27.88.221

Copy and paste these commands EXACTLY on your server.

---

## STEP 1: SSH INTO YOUR SERVER

```bash
ssh ubuntu@3.27.88.221
# Or: ssh your-username@3.27.88.221
```

---

## STEP 2: INSTALL PREREQUISITES (First Time Only)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

---

## STEP 3: SETUP POSTGRESQL DATABASE

```bash
# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE adencerp;
CREATE USER adencerp WITH ENCRYPTED PASSWORD 'AdencERP2026!SecureDB';
GRANT ALL PRIVILEGES ON DATABASE adencerp TO adencerp;
\c adencerp
GRANT ALL ON SCHEMA public TO adencerp;
\q
EOF
```

**Test database connection:**
```bash
psql -U adencerp -d adencerp -h localhost
# Enter password: AdencERP2026!SecureDB
# Type \q to exit
```

---

## STEP 4: CLONE REPOSITORY

```bash
# Create directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone https://github.com/Niklasnxs/AdencERP.git

# Change ownership to your user
sudo chown -R $USER:$USER /var/www/AdencERP

# Go to project directory
cd /var/www/AdencERP
```

---

## STEP 5: CREATE FRONTEND .ENV FILE

```bash
cd /var/www/AdencERP

cat > .env << 'EOF'
VITE_API_URL=http://3.27.88.221/api
VITE_EMAIL_SERVICE_URL=http://3.27.88.221/api/send-email
EOF

# Verify file was created
cat .env
```

**Expected output:**
```
VITE_API_URL=http://3.27.88.221/api
VITE_EMAIL_SERVICE_URL=http://3.27.88.221/api/send-email
```

---

## STEP 6: CREATE BACKEND .ENV FILE

```bash
cd /var/www/AdencERP/backend-service

cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USER=adencerp
DB_PASSWORD=AdencERP2026!SecureDB
DB_NAME=adencerp
PORT=3002
NODE_ENV=production
JWT_SECRET=AdencERP2026_JWT_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION_32CHARS
ALLOWED_ORIGINS=http://3.27.88.221
EOF

# Verify file was created
cat .env
```

**Expected output:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=adencerp
DB_PASSWORD=AdencERP2026!SecureDB
DB_NAME=adencerp
PORT=3002
NODE_ENV=production
JWT_SECRET=AdencERP2026_JWT_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION_32CHARS
ALLOWED_ORIGINS=http://3.27.88.221
```

---

## STEP 7: CREATE EMAIL SERVICE .ENV FILE

**⚠️ IMPORTANT: Replace YOUR_EMAIL_PASSWORD with your actual SMTP password**

```bash
cd /var/www/AdencERP/email-service

cat > .env << 'EOF'
SMTP_HOST=v167832.kasserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=niklas.schindhelm@adence.de
SMTP_PASS=YOUR_EMAIL_PASSWORD
PORT=3001
ALLOWED_ORIGINS=http://3.27.88.221
EOF

# Edit the file to add your actual email password
nano .env
# Replace YOUR_EMAIL_PASSWORD with your actual password
# Press Ctrl+X, then Y, then Enter to save
```

**Expected output (after you edit):**
```
SMTP_HOST=v167832.kasserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=niklas.schindhelm@adence.de
SMTP_PASS=your_actual_password_here
PORT=3001
ALLOWED_ORIGINS=http://3.27.88.221
```

---

## STEP 8: INSTALL BACKEND DEPENDENCIES

```bash
cd /var/www/AdencERP/backend-service
npm install
```

---

## STEP 9: RUN DATABASE MIGRATIONS

```bash
cd /var/www/AdencERP/backend-service
npm run migrate
```

**Expected output:**
```
Running database migrations...
✓ Database tables created successfully
✓ Indexes created
✓ Default users created
```

---

## STEP 10: START BACKEND WITH PM2

```bash
cd /var/www/AdencERP/backend-service
pm2 start server.js --name adencerp-backend
pm2 save
```

**Test backend is running:**
```bash
curl http://localhost:3002/api/health
```

**Expected output:**
```json
{"status":"ok","service":"adencerp-backend"}
```

---

## STEP 11: INSTALL EMAIL SERVICE DEPENDENCIES

```bash
cd /var/www/AdencERP/email-service
npm install
```

---

## STEP 12: START EMAIL SERVICE WITH PM2

```bash
cd /var/www/AdencERP/email-service
pm2 start server.js --name adencerp-email
pm2 save
```

**Test email service is running:**
```bash
curl http://localhost:3001/api/health
```

**Expected output:**
```json
{"status":"ok"}
```

---

## STEP 13: CHECK PM2 STATUS

```bash
pm2 list
```

**Expected output:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime   │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ adencerp-backend     │ online  │ 0       │ 2s       │
│ 1   │ adencerp-email       │ online  │ 0       │ 1s       │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

---

## STEP 14: PULL LATEST UPDATES FROM GITHUB

```bash
cd /var/www/AdencERP
git pull origin main
```

**Expected output:**
```
Already up to date.
OR
Updating 7fe6d43..d515c70
Fast-forward
 ...
```

---

## STEP 15: INSTALL FRONTEND DEPENDENCIES

```bash
cd /var/www/AdencERP
npm install
```

---

## STEP 16: BUILD FRONTEND

```bash
cd /var/www/AdencERP
npm run build
```

**Expected output:**
```
✓ built in XXXms
dist/index.html               X.XX kB
dist/assets/index-XXXXX.js    XXX.XX kB
```

**Verify dist folder was created:**
```bash
ls -la dist/
```

---

## STEP 17: CONFIGURE NGINX

```bash
sudo nano /etc/nginx/sites-available/adencerp
```

**Paste this configuration EXACTLY:**

```nginx
server {
    listen 80;
    server_name 3.27.88.221;
    
    # Frontend (React build)
    location / {
        root /var/www/AdencERP/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Email Service
    location /api/send-email {
        proxy_pass http://localhost:3001/api/send-email;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**Save the file:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## STEP 18: ENABLE NGINX SITE

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/adencerp /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## STEP 19: RESTART NGINX

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

**Expected output:**
```
● nginx.service - A high performance web server
   Active: active (running)
```

Press `q` to exit the status view.

---

## STEP 20: SETUP PM2 STARTUP

```bash
pm2 startup
```

**Copy and run the command it outputs, then:**

```bash
pm2 save
```

---

## STEP 21: CONFIGURE FIREWALL (OPTIONAL BUT RECOMMENDED)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Type `y` when prompted.

---

## ✅ VERIFICATION

### 1. Check PM2 Processes
```bash
pm2 list
```
Both services should show "online".

### 2. Check Backend Health
```bash
curl http://localhost:3002/api/health
```

### 3. Check Email Service Health
```bash
curl http://localhost:3001/api/health
```

### 4. Check Database Connection
```bash
psql -U adencerp -d adencerp -h localhost -c "SELECT email, full_name, role FROM users;"
```
Password: `AdencERP2026!SecureDB`

**Expected output:**
```
           email            |   full_name   |   role   
----------------------------+---------------+----------
 admin@adenc.de             | Admin User    | admin
 max.mueller@adenc.de       | Max Müller    | employee
 anna.schmidt@adenc.de      | Anna Schmidt  | employee
```

### 5. Access Application
Open browser and go to: **http://3.27.88.221**

**Default Login:**
- **Email:** admin@adenc.de
- **Password:** admin123

---

## 🔄 UPDATING YOUR APPLICATION (AFTER CHANGES)

When you push changes to GitHub:

```bash
# SSH into server
ssh ubuntu@3.27.88.221

# Go to project directory
cd /var/www/AdencERP

# Pull latest code
git pull

# Update backend
cd backend-service
npm install
pm2 restart adencerp-backend

# Update email service
cd ../email-service
npm install
pm2 restart adencerp-email

# Rebuild frontend
cd ..
npm install
npm run build

# Nginx automatically serves new build - no restart needed
```

---

## 📊 MONITORING COMMANDS

```bash
# View all processes
pm2 list

# View backend logs
pm2 logs adencerp-backend

# View email service logs
pm2 logs adencerp-email

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# Restart backend
pm2 restart adencerp-backend

# Restart email service
pm2 restart adencerp-email

# Stop all PM2 processes
pm2 stop all

# Start all PM2 processes
pm2 start all
```

---

## 🚨 TROUBLESHOOTING

### Backend won't start
```bash
cd /var/www/AdencERP/backend-service
pm2 logs adencerp-backend --lines 50
```

### Can't access website
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check if services are running
pm2 list
```

### Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
psql -U adencerp -d adencerp -h localhost
```

### Port already in use
```bash
# Check what's using port 3002
sudo lsof -i :3002

# Kill process if needed
sudo kill -9 <PID>
```

---

## 🔒 SECURITY NOTES

⚠️ **CHANGE THESE IN PRODUCTION:**
1. Database password: `AdencERP2026!SecureDB`
2. JWT secret: `AdencERP2026_JWT_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION_32CHARS`
3. Admin password: After first login, change from `admin123`

---

## ✅ DONE!

Your application is now running at: **http://3.27.88.221**

**Login with:**
- Email: `admin@adenc.de`
- Password: `admin123`
