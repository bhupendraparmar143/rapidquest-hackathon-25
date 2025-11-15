/**
 * Message Queue Service
 * Uses Redis and BullMQ for reliable message processing
 * Handles incoming queries and routes them to workers
 */

const Queue = require('bull');
const redis = require('redis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client for general use
let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port
      },
      password: redisConfig.password
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Continuing without Redis (some features may be limited)');
    return null;
  }
}

// Queue names
const QUEUE_NAMES = {
  QUERY_PROCESSING: 'query-processing',
  TAGging: 'tagging',
  SENTIMENT: 'sentiment',
  PRIORITY: 'priority',
  SPAM_DETECTION: 'spam-detection',
  NOTIFICATION: 'notification'
};

/**
 * Create a queue instance
 * @param {string} queueName - Name of the queue
 * @returns {Queue} Bull queue instance
 */
function createQueue(queueName) {
  return new Queue(queueName, {
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000
      },
      removeOnFail: {
        age: 86400 // Keep failed jobs for 24 hours
      }
    }
  });
}

// Main query processing queue
const queryQueue = createQueue(QUEUE_NAMES.QUERY_PROCESSING);

// Worker queues
const taggingQueue = createQueue(QUEUE_NAMES.TAGging);
const sentimentQueue = createQueue(QUEUE_NAMES.SENTIMENT);
const priorityQueue = createQueue(QUEUE_NAMES.PRIORITY);
const spamQueue = createQueue(QUEUE_NAMES.SPAM_DETECTION);
const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION);

/**
 * Add a query to the processing queue
 * @param {Object} queryData - Query data to process
 * @returns {Promise<Job>} Bull job instance
 */
async function addQueryToQueue(queryData) {
  try {
    const job = await queryQueue.add('process-query', {
      queryId: queryData._id || queryData.id,
      subject: queryData.subject,
      content: queryData.content,
      channel: queryData.channel,
      senderName: queryData.senderName,
      senderEmail: queryData.senderEmail,
      metadata: queryData.metadata || {}
    }, {
      priority: getPriorityValue(queryData.priority),
      delay: 0
    });

    console.log(`📥 Query ${queryData._id} added to processing queue (Job ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error('Error adding query to queue:', error);
    throw error;
  }
}

/**
 * Get priority value for queue (higher number = higher priority)
 */
function getPriorityValue(priority) {
  const priorityMap = {
    urgent: 10,
    high: 7,
    medium: 4,
    low: 1
  };
  return priorityMap[priority] || 4;
}

/**
 * Add job to tagging queue
 */
async function addTaggingJob(queryId, content) {
  return await taggingQueue.add('tag-query', {
    queryId,
    content
  });
}

/**
 * Add job to sentiment analysis queue
 */
async function addSentimentJob(queryId, content) {
  return await sentimentQueue.add('analyze-sentiment', {
    queryId,
    content
  });
}

/**
 * Add job to priority detection queue
 */
async function addPriorityJob(queryId, queryData) {
  return await priorityQueue.add('detect-priority', {
    queryId,
    queryData
  });
}

/**
 * Add job to spam detection queue
 */
async function addSpamJob(queryId, content, senderEmail) {
  return await spamQueue.add('detect-spam', {
    queryId,
    content,
    senderEmail
  });
}

/**
 * Add notification job
 */
async function addNotificationJob(type, recipient, data) {
  return await notificationQueue.add('send-notification', {
    type, // 'email', 'slack', 'push'
    recipient,
    data
  });
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const stats = {
      queryProcessing: {
        waiting: await queryQueue.getWaitingCount(),
        active: await queryQueue.getActiveCount(),
        completed: await queryQueue.getCompletedCount(),
        failed: await queryQueue.getFailedCount()
      },
      tagging: {
        waiting: await taggingQueue.getWaitingCount(),
        active: await taggingQueue.getActiveCount()
      },
      sentiment: {
        waiting: await sentimentQueue.getWaitingCount(),
        active: await sentimentQueue.getActiveCount()
      },
      priority: {
        waiting: await priorityQueue.getWaitingCount(),
        active: await priorityQueue.getActiveCount()
      }
    };
    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
}

/**
 * Clean up queues (remove old jobs)
 */
async function cleanQueues() {
  try {
    await queryQueue.clean(3600000, 'completed'); // 1 hour
    await queryQueue.clean(86400000, 'failed'); // 24 hours
    console.log('✅ Queues cleaned');
  } catch (error) {
    console.error('Error cleaning queues:', error);
  }
}

module.exports = {
  initRedis,
  redisClient: () => redisClient,
  queryQueue,
  taggingQueue,
  sentimentQueue,
  priorityQueue,
  spamQueue,
  notificationQueue,
  addQueryToQueue,
  addTaggingJob,
  addSentimentJob,
  addPriorityJob,
  addSpamJob,
  addNotificationJob,
  getQueueStats,
  cleanQueues,
  QUEUE_NAMES
};

