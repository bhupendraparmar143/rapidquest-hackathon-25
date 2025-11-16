/**
 * Notification Worker
 * Processes notification jobs from the queue
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { processNotification } = require('../services/notificationService');

function registerNotificationWorker(notificationQueue) {
  if (!notificationQueue) {
    console.warn('Notification queue not available, skipping notification worker registration');
    return;
  }

  notificationQueue.process('send-notification', async (job) => {
    const { type, recipient, data } = job.data;
    console.log(`📧 Processing ${type} notification to ${recipient || 'channel'}`);

    try {
      const result = await processNotification({ type, recipient, data });
      console.log(`✅ ${type} notification sent successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Error sending ${type} notification:`, error);
      throw error;
    }
  });

  notificationQueue.on('error', (error) => {
    const errorMsg = error.message || String(error);
    // Suppress connection errors - these are expected when Redis isn't running
    if (!errorMsg.includes('ECONNREFUSED') && 
        !errorMsg.includes('connect') && 
        !errorMsg.includes('Connection') &&
        !errorMsg.includes('ENOTFOUND')) {
      console.error('❌ Notification queue error:', errorMsg);
    }
  });

  notificationQueue.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job.id} failed:`, err.message);
  });

  console.log('📧 Notification worker registered');
}

module.exports = { registerNotificationWorker };

