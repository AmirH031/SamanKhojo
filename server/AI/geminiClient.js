const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchShopsAndItems } = require('../firestore/searchEngine');
const { getSearchPrompt, getBookingPrompt, getFaqPrompt } = require('./promptTemplates');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' });

// Language detection helper
function detectLanguage(text) {
  const hindiPattern = /[\u0900-\u097F]/;
  const englishPattern = /[a-zA-Z]/;
  
  const hasHindi = hindiPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  
  if (hasHindi && hasEnglish) return 'mixed';
  if (hasHindi) return 'hindi';
  if (hasEnglish) return 'english';
  return 'english'; // default
}

// Extract intent from message
function extractIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Search intents
  if (lowerMessage.includes('kaha') || lowerMessage.includes('where') || 
      lowerMessage.includes('milegi') || lowerMessage.includes('chahiye') ||
      lowerMessage.includes('find') || lowerMessage.includes('search')) {
    return 'search';
  }
  
  // Restaurant/food intents
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') ||
      lowerMessage.includes('khana') || lowerMessage.includes('hotel') ||
      lowerMessage.includes('cafe')) {
    return 'restaurant';
  }
  
  // Booking intents
  if (lowerMessage.includes('book') || lowerMessage.includes('order') ||
      lowerMessage.includes('chahiye') || lowerMessage.includes('want')) {
    return 'booking';
  }
  
  // FAQ intents
  if (lowerMessage.includes('help') || lowerMessage.includes('how') ||
      lowerMessage.includes('kaise') || lowerMessage.includes('madad')) {
    return 'faq';
  }
  
  return 'search'; // default to search
}

// Extract keywords from message
function extractKeywords(message) {
  const commonWords = ['kaha', 'where', 'milegi', 'chahiye', 'find', 'search', 'nearby', 'paas', 'me', 'mein', 'hai', 'is', 'the', 'a', 'an'];
  
  return message
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5); // Take top 5 keywords
}

async function processUserMessage({ message, phoneNumber, userName, timestamp }) {
  try {
    console.log(`🤖 Processing message: "${message}" from ${userName}`);
    
    // Detect language and extract intent
    const language = detectLanguage(message);
    const intent = extractIntent(message);
    const keywords = extractKeywords(message);
    
    console.log(`📊 Analysis - Language: ${language}, Intent: ${intent}, Keywords: ${keywords.join(', ')}`);
    
    // Search for relevant shops and items
    const searchResults = await searchShopsAndItems(keywords, { limit: 5 });
    
    // Get appropriate prompt based on intent
    let prompt;
    switch (intent) {
      case 'restaurant':
        prompt = getSearchPrompt(message, language, searchResults, 'restaurant');
        break;
      case 'booking':
        prompt = getBookingPrompt(message, language, searchResults);
        break;
      case 'faq':
        prompt = getFaqPrompt(message, language);
        break;
      default:
        prompt = getSearchPrompt(message, language, searchResults);
    }
    
    // Generate AI response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiReply = response.text();
    
    console.log(`🤖 AI Response: ${aiReply}`);
    
    // Create search URL for user
    const searchUrl = `${process.env.BASE_WEB_URL || 'https://saman-khojo.com'}/search?q=${encodeURIComponent(keywords.join(' '))}`;
    
    // Format final reply
    const finalReply = formatFinalReply(aiReply, searchUrl, language);
    
    return {
      reply: finalReply,
      intent,
      language,
      keywords,
      searchResults: searchResults.length,
      searchUrl
    };
    
  } catch (error) {
    console.error('🤖 Gemini AI processing error:', error);
    throw error;
  }
}

function formatFinalReply(aiReply, searchUrl, language) {
  // Clean up AI reply (remove markdown, excessive formatting)
  let cleanReply = aiReply
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove headers
    .trim();
  
  // Ensure reply is not too long (WhatsApp limit ~4096 chars)
  if (cleanReply.length > 300) {
    cleanReply = cleanReply.substring(0, 297) + '...';
  }
  
  // Add search link based on language
  const linkText = language === 'hindi' ? 
    '\n\n🔎 पूरी जानकारी के लिए यहाँ क्लिक करें:' : 
    '\n\n🔎 Click here for full details:';
  
  return `${cleanReply}${linkText}\n${searchUrl}`;
}

// Test function for development
async function testGeminiConnection() {
  try {
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    console.log('✅ Gemini AI connection test successful:', response.text());
    return true;
  } catch (error) {
    console.error('❌ Gemini AI connection test failed:', error);
    return false;
  }
}

module.exports = {
  processUserMessage,
  testGeminiConnection,
  detectLanguage,
  extractIntent,
  extractKeywords
};