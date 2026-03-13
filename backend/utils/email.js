const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const mailFromRaw = process.env.MAIL_FROM || 'BeThere <support@bethereexperience.com>';

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Parse "Name <email@example.com>" into { name, email }
const parseFrom = (fromStr) => {
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'BeThere', email: fromStr.trim() };
};

const mailFrom = parseFrom(mailFromRaw);

console.log('📧 Email Configuration (Nodemailer):');
console.log(`   Host: ${SMTP_HOST}`);
console.log(`   Port: ${SMTP_PORT}`);
console.log(`   User: ${SMTP_USER ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   Pass: ${SMTP_PASS ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   From: ${mailFrom.name} <${mailFrom.email}>`);

// Verify transporter on startup
if (SMTP_USER && SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Nodemailer Transporter Error:', error.message);
    } else {
      console.log('✅ Nodemailer Transporter is ready');
    }
  });
}

/**
 * Sends an email using Nodemailer
 * @param {Object} mailOptions - { to, subject, html, text, from }
 */
async function sendEmail(mailOptions) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('❌ Nodemailer configuration missing in .env');
    return { delivered: false, error: 'SMTP configuration missing' };
  }

  try {
    console.log(`\n📨 Attempting to send email via Nodemailer to: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    
    const info = await transporter.sendMail({
      from: mailOptions.from || mailFromRaw,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text || '',
      html: mailOptions.html,
    });

    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return { delivered: true, data: info };
  } catch (error) {
    console.error(`❌ Email send failed via Nodemailer!`);
    console.error(`   Error: ${error.message}`);
    return { delivered: false, error: error.message };
  }
}

/* 
// Legacy Sender.net Logic (Commented out)
const axios = require('axios');
const SENDER_API_KEY = process.env.SENDER_API_KEY;
async function sendEmailSenderNet(mailOptions) {
  // ... (Sender.net implementation)
}
*/

module.exports = { sendEmail, mailFrom: mailFromRaw };
