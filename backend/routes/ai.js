const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BETHERE_KNOWLEDGE } = require('../knowledge/bethereKnowledge');
const router = express.Router();

// Initialize Gemini with API key from environment
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'AI service is not configured' 
      });
    }

    // Create chat context with knowledge base
    const context = [
      BETHERE_KNOWLEDGE,
      ...history.map(msg => `${msg.role}: ${msg.content}`),
      `user: ${message}`
    ].join('\n\n');

    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI assistant. Please try again.' 
    });
  }
});

// Quick response endpoint (no history)
router.post('/quick', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'AI service is not configured' 
      });
    }

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI assistant. Please try again.' 
    });
  }
});

module.exports = router;
