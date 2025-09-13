// Reusable Gemini AI prompt templates

function getSearchPrompt(userMessage, language, searchResults, category = 'general') {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const systemContext = `You are SamanKhojo's helpful assistant. You help users find local shops and items in India. 
Always be friendly, concise, and helpful. Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'}.
Keep responses under 200 characters. Focus on the top 2-3 most relevant results.`;

  const searchContext = searchResults.length > 0 ? 
    `Available shops and items: ${JSON.stringify(searchResults.slice(0, 3))}` : 
    'No specific results found in database.';

  const responseGuidelines = isHindi ? 
    `जवाब हिंदी या हिंग्लिश में दें। 2-3 बेहतरीन दुकानों के नाम बताएं। संक्षिप्त और मददगार रहें।` :
    `Respond in English. Mention 2-3 best shops/options. Be brief and helpful.`;

  return `${systemContext}

User asked: "${userMessage}"
${searchContext}

${responseGuidelines}

Example good responses:
- "आपको चीनी के लिए राम किराना स्टोर और शर्मा जनरल स्टोर मिल जाएगा! 🛍️"
- "For sugar, try Ram Kirana Store and Sharma General Store nearby! 🛍️"

Your response:`;
}

function getBookingPrompt(userMessage, language, searchResults) {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const systemContext = `You are helping a user who wants to book/order items. 
Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'}.
Be encouraging and mention that they can contact shops directly.`;

  const responseGuidelines = isHindi ?
    `बुकिंग के लिए प्रोत्साहित करें। दुकान से संपर्क करने को कहें। 2 लाइन में जवाब दें।` :
    `Encourage booking. Mention contacting shops directly. Keep response to 2 lines.`;

  return `${systemContext}

User wants to book: "${userMessage}"
Available options: ${JSON.stringify(searchResults.slice(0, 2))}

${responseGuidelines}

Your response:`;
}

function getFaqPrompt(userMessage, language) {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const systemContext = `You are SamanKhojo's support assistant. Answer common questions about:
- How to find shops
- How to book items  
- How the service works
Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'}. Keep it brief and helpful.`;

  const commonFAQs = `
Common topics:
- Finding nearby shops: "Search by item name or location"
- Booking process: "Contact shops directly via WhatsApp"
- Service areas: "Available across India"
- Cost: "Free to use"`;

  return `${systemContext}

${commonFAQs}

User asked: "${userMessage}"

Provide a helpful, brief answer:`;
}

function getRestaurantPrompt(userMessage, language, searchResults) {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const systemContext = `You are helping users find restaurants, cafes, and food options.
Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'}.
Focus on food establishments and dining options.`;

  return `${systemContext}

User is looking for: "${userMessage}"
Available restaurants: ${JSON.stringify(searchResults.filter(r => ['restaurant', 'cafe', 'hotel'].includes(r.type)))}

Suggest the best food options briefly:`;
}

function getLocationPrompt(userMessage, language, userLocation) {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const systemContext = `You are helping users find shops near their location.
Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'}.
Focus on nearby options and distance.`;

  return `${systemContext}

User location context: ${userLocation || 'Location not specified'}
User asked: "${userMessage}"

Provide location-based suggestions:`;
}

// Template for emergency/urgent requests
function getUrgentPrompt(userMessage, language, searchResults) {
  const isHindi = language === 'hindi' || language === 'mixed';
  
  const urgentWords = ['urgent', 'emergency', 'turant', 'jaldi', 'abhi'];
  const isUrgent = urgentWords.some(word => userMessage.toLowerCase().includes(word));
  
  if (!isUrgent) {
    return getSearchPrompt(userMessage, language, searchResults);
  }

  const systemContext = `User has an urgent request. Prioritize shops that are:
- Currently open
- Nearby
- Have good availability
Respond in ${isHindi ? 'Hindi or Hinglish' : 'English'} with urgency.`;

  return `${systemContext}

URGENT REQUEST: "${userMessage}"
Available options: ${JSON.stringify(searchResults.slice(0, 2))}

Provide immediate, helpful suggestions:`;
}

module.exports = {
  getSearchPrompt,
  getBookingPrompt,
  getFaqPrompt,
  getRestaurantPrompt,
  getLocationPrompt,
  getUrgentPrompt
};