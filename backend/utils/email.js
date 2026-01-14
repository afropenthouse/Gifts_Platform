const nodemailer = require('nodemailer');

// Email transporter with explicit SMTP config and timeouts for reliability
const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
const smtpSecure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === 'true'
  : process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : true;
const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

console.log('📧 Email Configuration:');
console.log(`   Host: ${smtpHost}`);
console.log(`   Port: ${smtpPort}`);
console.log(`   Secure: ${smtpSecure}`);
console.log(`   User: ${smtpUser ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   Pass: ${smtpPass ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   From: ${mailFrom}`);
console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

async function sendEmail(mailOptions) {
  try {
    console.log(`\n📨 Attempting to send email to: ${mailOptions.to}`);
    console.log(`   From: ${mailOptions.from}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
    console.log(`   Response: ${info.response}`);
    return { delivered: true };
  } catch (error) {
    console.error(`❌ Email send failed!`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error?.message || error}`);
    console.error(`   Full Error:`, error);
    return { delivered: false, error };
  }
}

module.exports = { sendEmail, mailFrom };