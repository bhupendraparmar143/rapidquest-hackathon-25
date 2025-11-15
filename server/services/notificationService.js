/**
 * Notification Service
 * Handles sending notifications via Email, Slack, and Push notifications
 */

const nodemailer = require('nodemailer');
const { addNotificationJob } = require('./queueService');

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
};

// Create email transporter
let emailTransporter = null;

if (emailConfig.auth.user && emailConfig.auth.pass) {
  emailTransporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
  });
}

/**
 * Send email notification
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
async function sendEmail(options) {
  if (!emailTransporter) {
    console.warn('⚠️  Email not configured. Set SMTP_USER and SMTP_PASSWORD in .env');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const mailOptions = {
      from: `"Query Management System" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Send Slack notification
 * @param {Object} options - Slack options
 * @returns {Promise<Object>} Send result
 */
async function sendSlackNotification(options) {
  const axios = require('axios');
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️  Slack webhook not configured. Set SLACK_WEBHOOK_URL in .env');
    return { success: false, message: 'Slack not configured' };
  }

  try {
    const payload = {
      text: options.text,
      channel: options.channel || '#queries',
      username: 'Query Management Bot',
      icon_emoji: ':email:',
      attachments: options.attachments || []
    };

    const response = await axios.post(webhookUrl, payload);
    console.log(`✅ Slack notification sent to ${options.channel || '#queries'}`);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
    throw error;
  }
}

/**
 * Send push notification (placeholder - implement with FCM/APNS)
 * @param {Object} options - Push options
 * @returns {Promise<Object>} Send result
 */
async function sendPushNotification(options) {
  // Placeholder for push notification implementation
  // Integrate with Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
  console.log('📱 Push notification (not implemented):', options);
  return { success: false, message: 'Push notifications not implemented' };
}

/**
 * Notify user about new query assignment
 */
async function notifyQueryAssignment(userEmail, userName, query) {
  const subject = `New Query Assigned: ${query.subject}`;
  const text = `
Hello ${userName},

A new query has been assigned to you:

Subject: ${query.subject}
Priority: ${query.priority}
Channel: ${query.channel}
From: ${query.senderName}

View and respond: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/query/${query._id}

Best regards,
Query Management System
  `;

  // Add to notification queue for async processing
  await addNotificationJob('email', userEmail, {
    subject,
    text,
    html: text.replace(/\n/g, '<br>')
  });

  // Also send Slack notification if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    await addNotificationJob('slack', null, {
      text: `📧 New query assigned to ${userName}`,
      attachments: [{
        color: query.priority === 'urgent' ? 'danger' : query.priority === 'high' ? 'warning' : 'good',
        title: query.subject,
        fields: [
          { title: 'Priority', value: query.priority, short: true },
          { title: 'Channel', value: query.channel, short: true },
          { title: 'From', value: query.senderName, short: true }
        ]
      }]
    });
  }
}

/**
 * Notify about escalated query
 */
async function notifyEscalation(query, assignedTeam) {
  const subject = `⚠️ Escalated Query: ${query.subject}`;
  const text = `
A query has been escalated and requires immediate attention:

Subject: ${query.subject}
Priority: ${query.priority}
Escalation Reason: ${query.escalationReason || 'Response time exceeded'}
Assigned Team: ${assignedTeam?.name || 'Unassigned'}

View query: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/query/${query._id}
  `;

  // Notify team members
  if (assignedTeam) {
    const User = require('../models/User');
    const teamMembers = await User.find({ team: assignedTeam._id, isActive: true });
    
    for (const member of teamMembers) {
      await addNotificationJob('email', member.email, {
        subject,
        text,
        html: text.replace(/\n/g, '<br>')
      });
    }
  }

  // Slack notification
  if (process.env.SLACK_WEBHOOK_URL) {
    await addNotificationJob('slack', null, {
      text: `🚨 Query Escalated: ${query.subject}`,
      attachments: [{
        color: 'danger',
        title: query.subject,
        text: query.escalationReason || 'Response time exceeded'
      }]
    });
  }
}

/**
 * Process notification job from queue
 */
async function processNotification(jobData) {
  const { type, recipient, data } = jobData;

  try {
    switch (type) {
      case 'email':
        return await sendEmail({
          to: recipient,
          subject: data.subject,
          text: data.text,
          html: data.html
        });
      
      case 'slack':
        return await sendSlackNotification({
          text: data.text,
          channel: data.channel,
          attachments: data.attachments
        });
      
      case 'push':
        return await sendPushNotification({
          to: recipient,
          title: data.title,
          body: data.body
        });
      
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  } catch (error) {
    console.error(`Error processing ${type} notification:`, error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendSlackNotification,
  sendPushNotification,
  notifyQueryAssignment,
  notifyEscalation,
  processNotification
};

