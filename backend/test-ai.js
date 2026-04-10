require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Testing Gemini API connection...');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
    
    model.generateContent('Hello, can you help me?')
      .then(result => {
        return result.response;
      })
      .then(response => {
        console.log('Success! Response:', response.text());
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
  } catch (error) {
    console.error('Initialization error:', error.message);
    process.exit(1);
  }
} else {
  console.error('GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}
