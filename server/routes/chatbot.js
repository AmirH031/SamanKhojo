/**
 * Chatbot API Routes
 * Provides web endpoints for the Saman Khojo AI chatbot
 */

const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const rateLimit = require('express-rate-limit');

// Rate limiting for chatbot API
const chatbotRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    error: 'Too many chat messages. Please wait a moment.',
    type: 'rate_limit'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Main chat endpoint
router.post('/chat', chatbotRateLimit, async (req, res) => {
  try {
    const { message, userLocation, userId } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        type: 'validation_error'
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long. Please keep it under 500 characters.',
        type: 'validation_error'
      });
    }

    // Validate user location if provided
    let location = null;
    if (userLocation && userLocation.lat && userLocation.lng) {
      const lat = parseFloat(userLocation.lat);
      const lng = parseFloat(userLocation.lng);
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        location = { lat, lng };
      }
    }

    // Generate userId if not provided
    const sessionUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process message with enhanced chatbot service
    const response = await chatbotService.handleMessage(message.trim(), location, sessionUserId);

    res.json(response);
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({
      type: 'error',
      message: 'I apologize, but I encountered a technical issue. Please try again in a moment.',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get chat suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      {
        text: "Find rice shops near me",
        category: "search",
        icon: "🛒"
      },
      {
        text: "Pizza price",
        category: "price",
        icon: "💰"
      },
      {
        text: "Mobile repair shops",
        category: "service",
        icon: "🔧"
      },
      {
        text: "Best grocery stores",
        category: "shop",
        icon: "🏪"
      },
      {
        text: "Mehndi ka kond",
        category: "beauty",
        icon: "💄"
      },
      {
        text: "Medicine shop location",
        category: "health",
        icon: "💊"
      }
    ];

    res.json({
      suggestions,
      categories: [
        { name: "Popular", items: suggestions.slice(0, 3) },
        { name: "Services", items: suggestions.filter(s => s.category === "service") },
        { name: "Shopping", items: suggestions.filter(s => ["search", "shop"].includes(s.category)) }
      ]
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get chat history (placeholder for future implementation)
router.get('/history', async (req, res) => {
  try {
    // For now, return empty history
    // In future, implement user sessions and chat history storage
    res.json({
      messages: [],
      hasMore: false
    });
  } catch (error) {
    console.error('History API error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Get learning statistics
router.get('/learning-stats', async (req, res) => {
  try {
    const conversationalAI = require('../services/conversationalAI');
    const stats = conversationalAI.getLearningStats();
    
    res.json({
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Learning stats error:', error);
    res.status(500).json({ error: 'Failed to get learning statistics' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Saman Khojo AI Chatbot',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Conversational AI',
      'Learning System',
      'Database Integration',
      'Multi-language Support'
    ]
  });
});

// Generate unique message ID
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = router;