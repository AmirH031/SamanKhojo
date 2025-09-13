const express = require('express');
const router = express.Router();
const { checkQuotaAndRespond } = require('../firestore/usageStats');
const { logInteraction } = require('../firestore/searchEngine');
const { sendMiniReply, sendFallbackMessage } = require('./sendMessage');
const { processUserMessage } = require('../AI/geminiClient');

// Webhook verification (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Webhook message handler (POST)
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Validate webhook payload
    if (!body.object || body.object !== 'whatsapp_business_account') {
      return res.status(400).json({ error: 'Invalid webhook object' });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await processIncomingMessage(change.value);
        }
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processIncomingMessage(messageData) {
  try {
    const messages = messageData.messages || [];
    const contacts = messageData.contacts || [];

    for (const message of messages) {
      // Skip if not a text message
      if (message.type !== 'text') {
        console.log('⏭️ Skipping non-text message:', message.type);
        continue;
      }

      const phoneNumber = message.from;
      const messageText = message.text.body;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);
      
      // Get contact info
      const contact = contacts.find(c => c.wa_id === phoneNumber);
      const userName = contact?.profile?.name || 'User';

      console.log(`📱 Incoming message from ${userName} (${phoneNumber}): "${messageText}"`);

      // Log interaction
      await logInteraction({
        phoneNumber,
        userName,
        message: messageText,
        timestamp,
        type: 'incoming'
      });

      // Check quota and respond
      const canRespond = await checkQuotaAndRespond(phoneNumber);
      
      if (!canRespond) {
        console.log('⚠️ Daily quota exceeded, sending fallback message');
        await sendFallbackMessage(phoneNumber, messageText);
        continue;
      }

      // Process message with AI
      try {
        const aiResponse = await processUserMessage({
          message: messageText,
          phoneNumber,
          userName,
          timestamp
        });

        if (aiResponse && aiResponse.reply) {
          await sendMiniReply(aiResponse.reply, phoneNumber);
          
          // Log AI response
          await logInteraction({
            phoneNumber,
            userName,
            message: aiResponse.reply,
            timestamp: new Date(),
            type: 'outgoing',
            aiProcessed: true
          });
        }
      } catch (aiError) {
        console.error('🤖 AI processing error:', aiError);
        
        // Send fallback message on AI failure
        await sendFallbackMessage(phoneNumber, messageText);
      }
    }
  } catch (error) {
    console.error('❌ Message processing error:', error);
  }
}

module.exports = router;