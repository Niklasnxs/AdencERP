# AdencERP Docker Deployment Guide

Complete guide to deploy AdencERP TimeTrack & Attendance System using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Server with ports 80 and 3001 available
- SSH access to your server

## Quick Start

### 1. Clone Repository on Server

```bash
git clone https://github.com/Niklasnxs/AdencERP.git
cd AdencERP
```

### 2. Configure Environment Variables

**A. Root .env file (optional for future backend):**

Copy the example file and configure:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_USER=adencerp
DB_PASSWORD=your_secure_password_here
DB_HOST=db
DB_PORT=5432
DB_NAME=adencerp
```

**B. Email service configuration:**

The email service requires SMTP credentials. Make sure `email-service/.env` file exists with:

```env
SMTP_HOST=v167832.kasserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=niklas.schindhelm@adence.de
SMTP_PASS=diu6hkRzkzMMyVgRDfkq
IMAP_HOST=v167832.kasserver.com
IMAP_PORT=993
IMAP_USER=niklas.schindhelm@adence.de
IMAP_PASS=diu6hkRzkzMMyVgRDfkq
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
```

**Note:** In production, update `ALLOWED_ORIGINS` to include your server's domain.

### 3. Build and Start Containers

```bash
# Build images and start containers
docker-compose up -d --build

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend:** `http://your-server-ip`
- **Email Service Health:** `http://your-server-ip:3001/api/health`

## Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ Port 80
         ▼
┌─────────────────┐
│  Nginx (Frontend)│
│   React App      │
└────────┬────────┘
         │ /api/*
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Email Service   │      │   PostgreSQL DB  │
│   Node.js API    │◄─────┤   Port 5432      │
│   Port 3001      │      │   (Future)       │
└──────────────────┘      └──────────────────┘
```

## Container Details

### Frontend Container
- **Name:** `adencerp-frontend`
- **Image:** Built from root Dockerfile
- **Port:** 80:80
- **Technology:** React + Vite + Nginx
- **Features:**
  - Multi-stage build (build + serve)
  - Gzip compression
  - Static asset caching
  - React Router support
  - API proxy to email service

### Email Service Container
- **Name:** `adencerp-email-service`
- **Image:** Built from email-service/Dockerfile
- **Port:** 3001:3001
- **Technology:** Node.js + Express + Nodemailer
- **Features:**
  - Email notifications
  - Health check endpoint
  - SMTP configuration
  - Auto-restart on failure

### PostgreSQL Database Container
- **Name:** `adencerp-database`
- **Image:** postgres:15-alpine
- **Port:** 5432:5432
- **Technology:** PostgreSQL 15
- **Features:**
  - Persistent data storage (volume)
  - Health checks
  - Auto-restart on failure
  - Ready for future backend migration
- **Note:** Currently not used by frontend (uses client-side storage)

## Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart frontend
docker-compose restart email-service
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f email-service

# Last 100 lines
docker-compose logs --tail=100
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or use this shortcut
docker-compose up -d --build --force-recreate
```

### Container Management

```bash
# Enter container shell
docker exec -it adencerp-frontend sh
docker exec -it adencerp-email-service sh

# Check container resource usage
docker stats

# Remove all containers and images
docker-compose down --rmi all --volumes
```

## Production Optimizations

### 1. Use a Reverse Proxy (Recommended)

Install Nginx on host machine:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already configured by certbot)
sudo systemctl status certbot.timer
```

Update nginx.conf to redirect HTTP to HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Your existing location blocks...
}
```

### 3. Set Up Automatic Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/adencerp"

mkdir -p $BACKUP_DIR

# Backup would go here if using a database
# For now, the app uses client-side storage

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 4. Monitor with Docker Healthchecks

The email service already has a healthcheck configured. Monitor it:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' adencerp-email-service

# Watch health status
watch -n 5 'docker inspect --format="{{.State.Health.Status}}" adencerp-email-service'
```

### 5. Resource Limits

Update docker-compose.yml to add resource limits:

```yaml
services:
  frontend:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs frontend
docker-compose logs email-service

# Rebuild from scratch
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Find what's using port 80
sudo lsof -i :80

# Kill the process or change port in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

### Email Service Not Working

```bash
# Check if service is running
docker-compose ps

# Test email service directly
curl http://localhost:3001/api/health

# Check environment variables
docker exec adencerp-email-service env | grep SMTP
```

### Frontend Not Loading

```bash
# Check if nginx is running
docker exec adencerp-frontend nginx -t

# Rebuild frontend
docker-compose up -d --build frontend
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to git
2. **Firewall**: Only expose necessary ports (80, 443)
3. **Updates**: Regularly update Docker images
4. **HTTPS**: Always use HTTPS in production
5. **Secrets**: Use Docker secrets for sensitive data in production

## Performance Tuning

### Nginx Optimization

Edit `nginx.conf` for better performance:

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
```

### Docker Compose Performance

```yaml
services:
  frontend:
    # ... existing config
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify configuration files
3. Review this documentation
4. Contact system administrator

## License

Private project - All rights reserved
