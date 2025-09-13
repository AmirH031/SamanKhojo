const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.API_VERSION || 'v18.0'}/${process.env.WHATSAPP_PHONE_ID}/messages`;

async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ WhatsApp message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ WhatsApp message send error:', error.response?.data || error.message);
    throw error;
  }
}

async function sendMiniReply(message, phoneNumber) {
  try {
    await sendWhatsAppMessage(phoneNumber, message);
    console.log(`📤 Mini reply sent to ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Failed to send mini reply:', error);
    throw error;
  }
}

async function sendFallbackMessage(phoneNumber, originalQuery) {
  try {
    const searchUrl = `${process.env.BASE_WEB_URL || 'https://saman-khojo.com'}/search?q=${encodeURIComponent(originalQuery)}`;
    
    const fallbackMessage = `Hi 👋! We've hit our daily message quota. 

🔎 Tap below to search everything on our website:
${searchUrl}

You can find shops, items, and get instant results! 🛍️`;

    await sendWhatsAppMessage(phoneNumber, fallbackMessage);
    console.log(`📤 Fallback message sent to ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Failed to send fallback message:', error);
    throw error;
  }
}

async function sendBookingConfirmation(shopPhone, userPhone, itemDetails) {
  try {
    const itemList = itemDetails.map(item => `• ${item.name} - ${item.quantity}${item.unit}`).join('\n');
    
    const confirmationMessage = `🛍️ New Booking Request!

Customer: ${userPhone}
Items requested:
${itemList}

Please confirm availability and contact the customer.

📱 Reply to this message to confirm or call the customer directly.

- SamanKhojo Team`;

    await sendWhatsAppMessage(shopPhone, confirmationMessage);
    console.log(`📤 Booking confirmation sent to shop ${shopPhone}`);
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error);
    throw error;
  }
}

async function sendTemplateMessage(to, templateName, languageCode, components) {
  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ WhatsApp template message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ WhatsApp template message error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendMiniReply,
  sendFallbackMessage,
  sendBookingConfirmation,
  sendTemplateMessage
};