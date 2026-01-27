# AdencERP Email Service

Secure email notification service for AdencERP TimeTrack & Attendance System.

## 🔒 Security Features

- **Environment Variables**: All credentials stored in `.env` file (never committed to git)
- **Separate Service**: Email service runs independently from main app
- **CORS Protection**: Only accepts requests from authorized origins
- **Encrypted Communication**: Uses SMTP with TLS

## 📦 Setup Instructions

### 1. Install Dependencies

```bash
cd email-service
npm install
```

### 2. Configuration

The `.env` file is already configured with your credentials:
- SMTP Host: v167832.kasserver.com
- SMTP Port: 587
- Email: niklas.schindhelm@adence.de
- ⚠️ **IMPORTANT**: Never commit the `.env` file to version control!

### 3. Start the Service

**Development Mode** (with auto-restart):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The service will start on **http://localhost:3001**

## 🚀 Usage

### From Frontend

The frontend already has an email service utility configured. Example usage:

```typescript
import { emailService } from '../services/emailService';

// Send task assignment notification
await emailService.sendTaskAssignmentNotification(
  'user@example.com',
  'John Doe',
  'Design Homepage',
  'Website Redesign'
);
```

### API Endpoints

#### Send Email
```
POST /api/send-email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "text": "Plain text message",
  "html": "<p>HTML message</p>"
}
```

#### Health Check
```
GET /api/health
```

## 🔧 Testing

Test the email service with curl:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email from AdencERP"
  }'
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | v167832.kasserver.com |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_SECURE` | Use SSL/TLS | false |
| `SMTP_USER` | Email account username | niklas.schindhelm@adence.de |
| `SMTP_PASS` | Email account password | (stored securely) |
| `PORT` | Service port | 3001 |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:5173 |

## 🛡️ Security Best Practices

1. ✅ `.env` file is in `.gitignore`
2. ✅ Credentials never hardcoded in source code
3. ✅ CORS protection enabled
4. ✅ TLS encryption for SMTP
5. ✅ Error messages don't leak sensitive info

## 🐛 Troubleshooting

**Connection Error:**
- Verify SMTP credentials in `.env`
- Check firewall settings
- Ensure port 587 is not blocked

**CORS Error:**
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart the service after changing environment variables

**Email Not Sending:**
- Check console logs for error messages
- Verify email account has SMTP access enabled
- Test with curl to isolate frontend issues

## 📊 Monitoring

The service logs all email operations:
- ✅ Successful sends
- ❌ Failed attempts
- 📧 Recipient information

Check console output for real-time monitoring.

## 🔄 Production Deployment

For production deployment:

1. Use a process manager (PM2, systemd, etc.)
2. Set up environment variables on server
3. Enable HTTPS for the API
4. Configure proper logging
5. Set up monitoring/alerts

Example with PM2:
```bash
npm install -g pm2
pm2 start server.js --name adencerp-email
pm2 save
pm2 startup
```

## 📞 Support

For issues or questions, contact the development team.
