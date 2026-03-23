const axios = require('axios');

const POSTMARK_SERVER_TOKEN = process.env.POSTMARK_SERVER_TOKEN;
const POSTMARK_MESSAGE_STREAM = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';
const mailFromRaw = process.env.MAIL_FROM || 'BeThere <support@bethereexperience.com>';

// Parse "Name <email@example.com>" into { name, email }
const parseFrom = (fromStr) => {
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'BeThere', email: fromStr.trim() };
};

const mailFrom = parseFrom(mailFromRaw);

console.log(`📧 Email Provider: Postmark`);
console.log(`   From: ${mailFrom.name} <${mailFrom.email}>`);

function extractEmail(fromValue) {
  if (!fromValue) return null;
  const parsed = parseFrom(fromValue);
  return parsed?.email || null;
}

async function sendEmailPostmark(mailOptions) {
  if (!POSTMARK_SERVER_TOKEN) {
    return { delivered: false, error: 'POSTMARK_SERVER_TOKEN missing' };
  }

  const parsedFrom = parseFrom(mailOptions.from || mailFromRaw);
  const fromEmail = parsedFrom?.email;
  const fromName = parsedFrom?.name || 'BeThere';
  if (!fromEmail) return { delivered: false, error: 'Invalid from address' };
  if (!mailOptions?.to) return { delivered: false, error: 'Missing recipient' };

  try {
    console.log(`\n📨 Attempting to send email via Postmark to: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);

    const response = await axios.post(
      'https://api.postmarkapp.com/email',
      {
        From: `${fromName} <${fromEmail}>`,
        To: mailOptions.to,
        Subject: mailOptions.subject,
        HtmlBody: mailOptions.html,
        TextBody: mailOptions.text || '',
        MessageStream: POSTMARK_MESSAGE_STREAM,
      },
      {
        headers: {
          'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000,
      }
    );

    return { delivered: true, data: response.data };
  } catch (error) {
    const message = error?.response?.data || error?.message || 'Postmark error';
    console.error('❌ Email send failed via Postmark:', message);
    return { delivered: false, error: message };
  }
}

async function sendEmail(mailOptions) {
  return sendEmailPostmark(mailOptions);
}

module.exports = { sendEmail, mailFrom: mailFromRaw };
