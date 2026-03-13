const axios = require('axios');

const SENDER_API_KEY = process.env.SENDER_API_KEY;
const mailFromRaw = process.env.MAIL_FROM || 'BeThere <teambethere@gmail.com>';

// Parse "Name <email@example.com>" into { name, email }
const parseFrom = (fromStr) => {
  const match = fromStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'BeThere', email: fromStr.trim() };
};

const mailFrom = parseFrom(mailFromRaw);

console.log('📧 Sender.net Email Configuration:');
console.log(`   API Key: ${SENDER_API_KEY ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   From Name: ${mailFrom.name}`);
console.log(`   From Email: ${mailFrom.email}`);

async function sendEmail(mailOptions) {
  if (!SENDER_API_KEY) {
    console.error('❌ SENDER_API_KEY not set in .env');
    return { delivered: false, error: 'SENDER_API_KEY missing' };
  }

  try {
    console.log(`\n📨 Attempting to send email via Sender.net to: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);
    
    const response = await axios.post('https://api.sender.net/v2/message/send', {
      to: {
        email: mailOptions.to,
        name: mailOptions.toName || ''
      },
      from: {
        email: mailFrom.email,
        name: mailFrom.name
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text || ''
    }, {
      headers: {
        'Authorization': `Bearer ${SENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201 || response.status === 202) {
      console.log(`✅ Email sent successfully via Sender.net!`);
      return { delivered: true, data: response.data };
    } else {
      console.error(`❌ Email send failed via Sender.net!`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Response:`, response.data);
      return { delivered: false, error: response.data };
    }
  } catch (error) {
    console.error(`❌ Email send failed via Sender.net!`);
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;
    console.error(`   Status: ${status}`);
    console.error(`   Error: ${message}`);
    
    if (status === 401) {
      console.error('   💡 TIP: Your API token might be missing "Transactional" permissions, or Transactional emails are not enabled in your Sender.net dashboard.');
    } else if (status === 403) {
      console.error('   💡 TIP: Your account might be suspended or your domain is not verified in Sender.net.');
    }
    
    return { delivered: false, error: message };
  }
}

module.exports = { sendEmail, mailFrom: mailFromRaw };
