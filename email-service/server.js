require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json());

// Create reusable transporter using SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection error:', error);
  } else {
    console.log('✅ Email service ready to send messages');
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and text/html'
      });
    }

    // Email options
    const mailOptions = {
      from: `"AdencERP System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AdencERP Email Service',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Email Service running on http://localhost:${PORT}`);
  console.log(`📧 Using SMTP: ${process.env.SMTP_HOST}`);
  console.log(`👤 From: ${process.env.SMTP_USER}\n`);
});
