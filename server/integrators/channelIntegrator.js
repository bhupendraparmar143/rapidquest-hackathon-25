/**
 * Channel Integrator Base Class
 * Handles incoming messages from various channels and normalizes them
 */

const Query = require('../models/Query');
const { addQueryToQueue } = require('../services/queueService');

/**
 * Normalize incoming message from any channel to unified format
 * @param {Object} rawMessage - Raw message from channel
 * @param {string} channel - Channel type
 * @returns {Object} Normalized query object
 */
function normalizeMessage(rawMessage, channel) {
  const normalized = {
    subject: rawMessage.subject || rawMessage.title || 'No Subject',
    content: rawMessage.content || rawMessage.body || rawMessage.message || '',
    channel: channel,
    senderName: rawMessage.senderName || rawMessage.from?.name || rawMessage.author || 'Unknown',
    senderEmail: rawMessage.senderEmail || rawMessage.from?.email || rawMessage.email || null,
    senderId: rawMessage.senderId || rawMessage.from?.id || rawMessage.userId || null,
    receivedAt: rawMessage.receivedAt || rawMessage.timestamp || new Date(),
    metadata: {
      channelId: rawMessage.channelId || rawMessage.id,
      channelMessageId: rawMessage.messageId,
      threadId: rawMessage.threadId,
      replyTo: rawMessage.replyTo,
      attachments: rawMessage.attachments || [],
      rawData: rawMessage // Keep original for reference
    }
  };

  return normalized;
}

/**
 * Process incoming message from any channel
 * @param {Object} rawMessage - Raw message data
 * @param {string} channel - Channel type
 * @returns {Promise<Object>} Created query
 */
async function processIncomingMessage(rawMessage, channel) {
  try {
    // Normalize message
    const normalizedData = normalizeMessage(rawMessage, channel);

    // Validate required fields
    if (!normalizedData.content || normalizedData.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    // Create query in database
    const query = new Query(normalizedData);
    
    // Set initial status
    query.status = 'new';
    query.priority = 'medium'; // Default, will be updated by priority worker

    // Save to database
    await query.save();

    // Add to processing queue for async processing
    await addQueryToQueue(query);

    console.log(`✅ Message processed from ${channel}: Query ${query._id}`);

    return query;
  } catch (error) {
    console.error(`❌ Error processing message from ${channel}:`, error);
    throw error;
  }
}

/**
 * Email channel integrator
 */
async function processEmailMessage(emailData) {
  return await processIncomingMessage({
    subject: emailData.subject,
    content: emailData.body || emailData.text || emailData.html,
    senderName: emailData.from?.name,
    senderEmail: emailData.from?.email,
    senderId: emailData.from?.email,
    receivedAt: emailData.date,
    messageId: emailData.messageId,
    threadId: emailData.threadId,
    attachments: emailData.attachments || []
  }, 'email');
}

/**
 * Instagram/Facebook channel integrator
 */
async function processSocialMediaMessage(socialData) {
  return await processIncomingMessage({
    subject: `Message from ${socialData.platform}`,
    content: socialData.message || socialData.text,
    senderName: socialData.from?.name,
    senderId: socialData.from?.id,
    senderEmail: socialData.from?.email,
    receivedAt: socialData.timestamp,
    messageId: socialData.id,
    threadId: socialData.threadId,
    platform: socialData.platform // 'instagram' or 'facebook'
  }, 'social_media');
}

/**
 * WhatsApp channel integrator
 */
async function processWhatsAppMessage(whatsappData) {
  return await processIncomingMessage({
    subject: 'WhatsApp Message',
    content: whatsappData.message || whatsappData.text,
    senderName: whatsappData.from?.name,
    senderId: whatsappData.from?.phone,
    senderEmail: whatsappData.from?.email,
    receivedAt: whatsappData.timestamp,
    messageId: whatsappData.id,
    threadId: whatsappData.conversationId
  }, 'chat'); // Using 'chat' for WhatsApp
}

/**
 * Website chat widget integrator
 */
async function processChatMessage(chatData) {
  return await processIncomingMessage({
    subject: 'Website Chat',
    content: chatData.message,
    senderName: chatData.visitor?.name || 'Website Visitor',
    senderEmail: chatData.visitor?.email,
    senderId: chatData.visitor?.id,
    receivedAt: chatData.timestamp,
    messageId: chatData.id,
    sessionId: chatData.sessionId
  }, 'chat');
}

/**
 * Community forum integrator
 */
async function processForumMessage(forumData) {
  return await processIncomingMessage({
    subject: forumData.title || forumData.subject,
    content: forumData.content || forumData.body,
    senderName: forumData.author?.name,
    senderEmail: forumData.author?.email,
    senderId: forumData.author?.id,
    receivedAt: forumData.createdAt || forumData.timestamp,
    messageId: forumData.id,
    threadId: forumData.threadId,
    forumId: forumData.forumId
  }, 'community');
}

module.exports = {
  normalizeMessage,
  processIncomingMessage,
  processEmailMessage,
  processSocialMediaMessage,
  processWhatsAppMessage,
  processChatMessage,
  processForumMessage
};

