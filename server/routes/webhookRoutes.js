/**
 * Webhook Routes
 * Receives incoming messages from various channels
 * Supports: Email, Instagram, Facebook, WhatsApp, Chat Widget, Forums
 */

const express = require('express');
const router = express.Router();
const {
  processEmailMessage,
  processSocialMediaMessage,
  processWhatsAppMessage,
  processChatMessage,
  processForumMessage
} = require('../integrators/channelIntegrator');

/**
 * Email Webhook (Gmail/Outlook)
 * POST /api/webhooks/email
 */
router.post('/email', async (req, res) => {
  try {
    const emailData = req.body;
    
    // Validate email data
    if (!emailData.from || !emailData.body) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email data. Required: from, body'
      });
    }

    const query = await processEmailMessage(emailData);

    res.status(201).json({
      success: true,
      message: 'Email processed successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing email',
      error: error.message
    });
  }
});

/**
 * Instagram/Facebook Webhook
 * POST /api/webhooks/social-media
 */
router.post('/social-media', async (req, res) => {
  try {
    const socialData = req.body;
    
    if (!socialData.message && !socialData.text) {
      return res.status(400).json({
        success: false,
        message: 'Invalid social media data. Required: message or text'
      });
    }

    const query = await processSocialMediaMessage(socialData);

    res.status(201).json({
      success: true,
      message: 'Social media message processed successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error processing social media webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing social media message',
      error: error.message
    });
  }
});

/**
 * WhatsApp Webhook
 * POST /api/webhooks/whatsapp
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const whatsappData = req.body;
    
    if (!whatsappData.message && !whatsappData.text) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp data. Required: message or text'
      });
    }

    const query = await processWhatsAppMessage(whatsappData);

    res.status(201).json({
      success: true,
      message: 'WhatsApp message processed successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing WhatsApp message',
      error: error.message
    });
  }
});

/**
 * Chat Widget Webhook
 * POST /api/webhooks/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const chatData = req.body;
    
    if (!chatData.message) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat data. Required: message'
      });
    }

    const query = await processChatMessage(chatData);

    res.status(201).json({
      success: true,
      message: 'Chat message processed successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error processing chat webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
    });
  }
});

/**
 * Community Forum Webhook
 * POST /api/webhooks/forum
 */
router.post('/forum', async (req, res) => {
  try {
    const forumData = req.body;
    
    if (!forumData.content && !forumData.body) {
      return res.status(400).json({
        success: false,
        message: 'Invalid forum data. Required: content or body'
      });
    }

    const query = await processForumMessage(forumData);

    res.status(201).json({
      success: true,
      message: 'Forum message processed successfully',
      queryId: query._id
    });
  } catch (error) {
    console.error('Error processing forum webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forum message',
      error: error.message
    });
  }
});

/**
 * Generic Webhook (for testing)
 * POST /api/webhooks/generic
 */
router.post('/generic', async (req, res) => {
  try {
    const { channel, ...messageData } = req.body;
    
    if (!channel) {
      return res.status(400).json({
        success: false,
        message: 'Channel type is required'
      });
    }

    const validChannels = ['email', 'social_media', 'chat', 'community', 'phone'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
      });
    }

    // Process based on channel type
    let query;
    switch (channel) {
      case 'email':
        query = await processEmailMessage(messageData);
        break;
      case 'social_media':
        query = await processSocialMediaMessage(messageData);
        break;
      case 'chat':
        query = await processChatMessage(messageData);
        break;
      case 'community':
        query = await processForumMessage(messageData);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    res.status(201).json({
      success: true,
      message: 'Message processed successfully',
      queryId: query._id,
      channel: channel
    });
  } catch (error) {
    console.error('Error processing generic webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
});

module.exports = router;

