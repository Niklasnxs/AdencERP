# TROUBLESHOOTING: Cannot Access http://16.176.18.228

If the page won't load or times out, follow these diagnostic steps:

---

## STEP 1: SSH into Your Server

```bash
ssh ubuntu@16.176.18.228
```

---

## STEP 2: Check if Nginx is Running

```bash
sudo systemctl status nginx
```

**Expected:** `Active: active (running)`

**If not running:**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## STEP 3: Check if PM2 Services are Running

```bash
pm2 list
```

**Expected:** Both `adencerp-backend` and `adencerp-email` should show status: `online`

**If not running:**
```bash
cd /var/www/AdencERP/backend-service
pm2 start server.js --name adencerp-backend

cd /var/www/AdencERP/email-service
pm2 start server.js --name adencerp-email

pm2 save
```

---

## STEP 4: Check if Frontend Build Exists

```bash
ls -la /var/www/AdencERP/dist/
```

**Expected:** You should see `index.html` and `assets/` folder

**If dist folder is missing or empty:**
```bash
cd /var/www/AdencERP
npm install
npm run build
```

---

## STEP 5: Check Nginx Configuration

```bash
sudo nginx -t
```

**Expected:** `syntax is ok` and `test is successful`

**If error, check config:**
```bash
sudo nano /etc/nginx/sites-available/adencerp
```

Make sure it matches the config in DEPLOY_ON_SERVER.md Step 17

---

## STEP 6: Check Nginx Error Logs

```bash
sudo tail -n 50 /var/log/nginx/error.log
```

This will show any nginx errors.

---

## STEP 7: Check if Nginx is Listening on Port 80

```bash
sudo netstat -tlnp | grep :80
```

**Expected:** Should show nginx listening on port 80

**If port 80 is not open:**
```bash
sudo systemctl restart nginx
```

---

## STEP 8: Check Firewall (UFW)

```bash
sudo ufw status
```

**Expected:** Port 80 should be ALLOWED

**If firewall is blocking:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## STEP 9: Check AWS Security Group (VERY IMPORTANT!)

**This is often the issue!**

Your AWS EC2 instance has a Security Group that acts as a firewall. You need to:

1. Go to AWS Console
2. Navigate to EC2 → Instances
3. Select your instance (16.176.18.228)
4. Click on "Security" tab
5. Click on the Security Group link
6. Click "Edit inbound rules"
7. Add rule:
   - **Type:** HTTP
   - **Protocol:** TCP
   - **Port:** 80
   - **Source:** 0.0.0.0/0 (Anywhere IPv4)
8. Click "Save rules"

**Also add:**
   - **Type:** HTTPS
   - **Protocol:** TCP  
   - **Port:** 443
   - **Source:** 0.0.0.0/0

---

## STEP 10: Test Backend Directly

```bash
curl http://localhost:3002/api/health
```

**Expected:** `{"status":"ok","service":"adencerp-backend"}`

**If not working:**
```bash
cd /var/www/AdencERP/backend-service
pm2 logs adencerp-backend --lines 20
```

---

## STEP 11: Test if Port 80 is Accessible from Outside

From your local machine (not the server):

```bash
telnet 16.176.18.228 80
```

Or use: https://www.yougetsignal.com/tools/open-ports/

Enter IP: `16.176.18.228` and Port: `80`

**If port is closed:** The issue is with AWS Security Group (see Step 9)

---

## STEP 12: Check Nginx Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

Leave this running, then try to access http://16.176.18.228 from your browser.
You should see log entries. If you don't, the request isn't reaching nginx (Security Group issue).

---

## STEP 13: Restart Everything

```bash
# Restart PM2 services
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Check status
pm2 list
sudo systemctl status nginx
```

---

## QUICK FIX CHECKLIST

Run these commands in order:

```bash
# 1. Check and start services
pm2 list
sudo systemctl status nginx

# 2. If services aren't running
cd /var/www/AdencERP/backend-service
pm2 start server.js --name adencerp-backend
cd /var/www/AdencERP/email-service  
pm2 start server.js --name adencerp-email
pm2 save

# 3. Restart nginx
sudo systemctl restart nginx

# 4. Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 5. Test locally
curl http://localhost
curl http://localhost:3002/api/health
```

---

## MOST COMMON ISSUES

### 1. AWS Security Group Not Configured (90% of cases!)
- Go to AWS Console → EC2 → Security Groups
- Add inbound rule for port 80 (HTTP) and 443 (HTTPS)
- Source: 0.0.0.0/0

### 2. Nginx Not Running
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. Frontend Not Built
```bash
cd /var/www/AdencERP
npm run build
```

### 4. Wrong Nginx Configuration
- Check `/etc/nginx/sites-enabled/adencerp` exists
- Should be symlink to `/etc/nginx/sites-available/adencerp`

### 5. Services Not Running
```bash
pm2 restart all
pm2 save
```

---

## STILL NOT WORKING?

Run this diagnostic script and share the output:

```bash
#!/bin/bash
echo "=== PM2 Status ==="
pm2 list

echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx

echo -e "\n=== Port 80 Check ==="
sudo netstat -tlnp | grep :80

echo -e "\n=== Firewall Status ==="
sudo ufw status

echo -e "\n=== Backend Health ==="
curl http://localhost:3002/api/health

echo -e "\n=== Nginx Config Test ==="
sudo nginx -t

echo -e "\n=== Recent Nginx Errors ==="
sudo tail -n 10 /var/log/nginx/error.log

echo -e "\n=== Dist Folder ==="
ls -la /var/www/AdencERP/dist/

echo -e "\n=== Backend Logs ==="
pm2 logs adencerp-backend --lines 5 --nostream
```

Save this as `diagnose.sh`, run `chmod +x diagnose.sh`, then `./diagnose.sh`
