/**
 * Notification Worker
 * Processes notification jobs from the queue
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { notificationQueue } = require('../services/queueService');
const { processNotification } = require('../services/notificationService');

/**
 * Process notification jobs
 */
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
  console.error('❌ Notification queue error:', error);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job.id} failed:`, err.message);
});

console.log('📧 Notification worker started');

