# AdencERP Deployment Guide (Without Docker)

Server: **http://3.27.88.221**

## Prerequisites on Server

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v15 or higher)
3. **PM2** (Process manager)
4. **Nginx** (Web server)

---

## Installation Steps

### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql:
CREATE DATABASE adencerp;
CREATE USER adencerp WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE adencerp TO adencerp;
\q
```

### 3. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/Niklasnxs/AdencERP.git
cd AdencERP
sudo chown -R $USER:$USER /var/www/AdencERP
```

### 4. Setup Backend Service

```bash
cd /var/www/AdencERP/backend-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=adencerp
DB_PASSWORD=your_secure_password
DB_NAME=adencerp
PORT=3002
NODE_ENV=production
JWT_SECRET=your_random_jwt_secret_here
ALLOWED_ORIGINS=http://3.27.88.221,http://localhost:5173
```

```bash
# Run database migrations
npm run migrate

# Start with PM2
pm2 start server.js --name adencerp-backend
pm2 save
pm2 startup
```

### 5. Setup Email Service

```bash
cd /var/www/AdencERP/email-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

Edit `.env` with your SMTP credentials

```bash
# Start with PM2
pm2 start server.js --name adencerp-email
pm2 save
```

### 6. Build Frontend

```bash
cd /var/www/AdencERP

# Install dependencies
npm install

# Build for production
npm run build
```

### 7. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/adencerp
```

Add this configuration:

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/adencerp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Access the Application

**URL:** http://3.27.88.221

**Default Login:**
- Admin: `admin@adenc.de` / `admin123`
- Employee: `max.mueller@adenc.de` / `emp123`

---

## Update Deployment

When you push changes to GitHub:

```bash
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

# Nginx will serve the new build automatically
```

---

## PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs adencerp-backend
pm2 logs adencerp-email

# Restart services
pm2 restart adencerp-backend
pm2 restart adencerp-email

# Stop services
pm2 stop adencerp-backend
pm2 stop adencerp-email
```

---

## Troubleshooting

### Backend not connecting to PostgreSQL
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U adencerp -d adencerp -h localhost
```

### Port already in use
```bash
# Check what's using port 3002
sudo lsof -i :3002

# Kill process if needed
sudo kill -9 <PID>
```

### Nginx 502 error
```bash
# Check backend is running
pm2 list

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Security Recommendations

1. Change default passwords in database
2. Use strong JWT_SECRET
3. Configure firewall (ufw)
4. Setup SSL with Let's Encrypt
5. Regular backups of PostgreSQL database

```bash
# Firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Database Backup

```bash
# Backup
pg_dump -U adencerp adencerp > backup_$(date +%Y%m%d).sql

# Restore
psql -U adencerp adencerp < backup_20260127.sql
```
