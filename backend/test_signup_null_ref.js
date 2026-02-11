const axios = require('axios');

async function testSignupNoReferral() {
  const url = 'http://localhost:5000/api/auth/signup';
  const payload = {
    name: 'Test User No Ref',
    email: `test_noref_${Date.now()}@example.com`,
    password: 'password123',
    agreedToTerms: true,
    referralCode: null // Testing the specific case that failed
  };

  try {
    console.log('Sending signup request (referralCode: null) with payload:', payload);
    const response = await axios.post(url, payload);
    console.log('Signup successful:', response.data);
  } catch (error) {
    console.error('Signup failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testSignupNoReferral();
