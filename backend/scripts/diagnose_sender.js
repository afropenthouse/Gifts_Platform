const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SENDER_API_KEY = process.env.SENDER_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM;

async function diagnose() {
  console.log('--- Sender.net Diagnostic Tool ---');
  console.log('API Key Status:', SENDER_API_KEY ? '✓ Found' : '✗ NOT FOUND');
  console.log('MAIL_FROM:', MAIL_FROM);

  if (!SENDER_API_KEY) {
    console.error('Error: SENDER_API_KEY is missing in .env');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${SENDER_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('\n1. Checking API Key Validity (Fetching Settings)...');
    const settingsResponse = await axios.get('https://api.sender.net/v2/subscribers', { headers });
    console.log('✅ API Key is valid. Fetched subscribers count:', settingsResponse.data.data.length);
  } catch (error) {
    console.error('✗ API Key Check Failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }

  try {
    console.log('\n2. Checking Account Details...');
    const accountResponse = await axios.get('https://api.sender.net/v2/users/me', { headers });
    console.log('✅ Account Name:', accountResponse.data.data.name);
    console.log('✅ Account Email:', accountResponse.data.data.email);
  } catch (error) {
    console.error('✗ Account Details Check Failed:', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n3. Listing Verified Domains...');
    const domainsResponse = await axios.get('https://api.sender.net/v2/domains', { headers });
    console.log('✅ Domains:', domainsResponse.data.data.map(d => `${d.domain} (Status: ${d.status})`).join(', '));
  } catch (error) {
    console.error('✗ Domains Check Failed:', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n4. Attempting Test Send (v2/message/send)...');
    const testSend = await axios.post('https://api.sender.net/v2/message/send', {
      to: { email: 'oluwaseunpaul98@gmail.com', name: 'Test User' },
      from: { email: 'support@bethereexperience.com', name: 'BeThere' },
      subject: 'Diagnostic Test Email (message/send)',
      html: '<p>This is a test from the diagnostic tool.</p>'
    }, { headers });
    console.log('✅ Test email sent successfully via message/send!');
  } catch (error) {
    console.error('✗ Test Send (message/send) Failed:', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n5. Attempting Test Send (v2/emails/transactional)...');
    const testSend2 = await axios.post('https://api.sender.net/v2/emails/transactional', {
      to: [{ email: 'oluwaseunpaul98@gmail.com', name: 'Test User' }],
      from: { email: 'support@bethereexperience.com', name: 'BeThere' },
      subject: 'Diagnostic Test Email (transactional)',
      html: '<p>This is a test from the diagnostic tool.</p>'
    }, { headers });
    console.log('✅ Test email sent successfully via emails/transactional!');
  } catch (error) {
    console.error('✗ Test Send (emails/transactional) Failed:', error.response?.status, error.response?.data?.message || error.message);
  }
}

diagnose();
