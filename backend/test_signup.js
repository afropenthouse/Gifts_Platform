const axios = require('axios');

async function testSignup() {
  const url = 'http://localhost:5000/api/auth/signup';
  const payload = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    agreedToTerms: true
  };

  try {
    console.log('Sending signup request with payload:', payload);
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

testSignup();
