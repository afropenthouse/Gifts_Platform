const axios = require('axios');

// Email provider: Zoho ZeptoMail (transactional email). Nodemailer/SMTP is intentionally parked for now.
const ZOHO_ENCZAPI_KEY = process.env.ZOHO_ENCZAPI_KEY;
const ZOHO_API_URL = process.env.ZOHO_API_URL || 'https://api.zeptomail.com/v1.1/email';
const mailFromRaw = process.env.MAIL_FROM || 'BeThere <support@bethereexperience.com>';

// Parse "Name <email@example.com>" into { name, email }
const parseFrom = (fromStr) => {
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'BeThere', email: fromStr.trim() };
};

// Parse a single address into a ZeptoMail email_address object
const parseAddress = (addr) => {
  const match = String(addr).match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim();
    return name ? { address: match[2].trim(), name } : { address: match[2].trim() };
  }
  return { address: String(addr).trim() };
};

const mailFrom = parseFrom(mailFromRaw);

console.log(`📧 Email Provider: Zoho ZeptoMail`);
console.log(`   From: ${mailFrom.name} <${mailFrom.email}>`);

function extractEmail(fromValue) {
  if (!fromValue) return null;
  const parsed = parseFrom(fromValue);
  return parsed?.email || null;
}

async function sendEmailZoho(mailOptions) {
  if (!ZOHO_ENCZAPI_KEY) {
    return { delivered: false, error: 'ZOHO_ENCZAPI_KEY missing' };
  }

  const parsedFrom = parseFrom(mailOptions.from || mailFromRaw);
  const fromEmail = parsedFrom?.email;
  const fromName = parsedFrom?.name || 'BeThere';
  if (!fromEmail) return { delivered: false, error: 'Invalid from address' };
  if (!mailOptions?.to) return { delivered: false, error: 'Missing recipient' };

  const toList = String(mailOptions.to)
    .split(',')
    .map((addr) => addr.trim())
    .filter(Boolean)
    .map((addr) => ({ email_address: parseAddress(addr) }));

  try {
    console.log(`\n📨 Attempting to send email via Zoho ZeptoMail to: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);

    const response = await axios.post(
      ZOHO_API_URL,
      {
        from: { address: fromEmail, name: fromName },
        to: toList,
        subject: mailOptions.subject,
        htmlbody: mailOptions.html,
        textbody: mailOptions.text || undefined,
      },
      {
        headers: {
          'Authorization': `Zoho-enczapikey ${ZOHO_ENCZAPI_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000,
      }
    );

    return { delivered: true, data: response.data };
  } catch (error) {
    const message = error?.response?.data || error?.message || 'Zoho ZeptoMail error';
    console.error('❌ Email send failed via Zoho ZeptoMail:', message);
    return { delivered: false, error: message };
  }
}

async function sendEmail(mailOptions) {
  return sendEmailZoho(mailOptions);
}

module.exports = { sendEmail, mailFrom: mailFromRaw };
