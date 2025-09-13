const { sendFallbackMessage } = require('./sendMessage');

class FallbackHandler {
  static async handleQuotaExceeded(phoneNumber, originalQuery) {
    try {
      await sendFallbackMessage(phoneNumber, originalQuery);
      console.log(`📤 Quota exceeded fallback sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Fallback handler error:', error);
      return false;
    }
  }

  static async handleAIError(phoneNumber, originalQuery, error) {
    try {
      const errorMessage = `🤖 Sorry, I'm having trouble understanding your request right now.

🔎 You can search directly on our website:
${process.env.BASE_WEB_URL || 'https://saman-khojo.com'}/search?q=${encodeURIComponent(originalQuery)}

Or try asking me again in a few minutes! 😊`;

      await sendWhatsAppMessage(phoneNumber, errorMessage);
      console.log(`📤 AI error fallback sent to ${phoneNumber}`);
      return true;
    } catch (fallbackError) {
      console.error('❌ AI error fallback failed:', fallbackError);
      return false;
    }
  }

  static async handleUnsupportedMessage(phoneNumber, messageType) {
    try {
      const unsupportedMessage = `📱 I can only understand text messages right now.

💬 Please send me a text message like:
• "chini kaha milegi?"
• "restaurants nearby"
• "grocery shops"

Or visit our website: ${process.env.BASE_WEB_URL || 'https://saman-khojo.com'} 🛍️`;

      await sendWhatsAppMessage(phoneNumber, unsupportedMessage);
      console.log(`📤 Unsupported message type fallback sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Unsupported message fallback error:', error);
      return false;
    }
  }
}

module.exports = FallbackHandler;