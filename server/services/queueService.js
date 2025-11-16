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
        port: redisConfig.port,
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️  Redis connection failed after 3 retries. Continuing without Redis.');
            return false; // Stop retrying
          }
          return Math.min(retries * 100, 3000);
        }
      },
      password: redisConfig.password
    });

    // Suppress error logging - we handle it in the catch block
    redisClient.on('error', (err) => {
      // Completely suppress Redis connection errors - they're expected when Redis isn't running
      // Handle AggregateError which may contain nested errors
      let errorMsg = '';
      let errorName = '';
      let errorCode = '';
      
      if (err) {
        // Handle AggregateError
        if (err.name === 'AggregateError' && err.errors && Array.isArray(err.errors)) {
          // Check if any nested error is a connection error
          const hasConnectionError = err.errors.some(e => 
            (e?.message || '').includes('ECONNREFUSED') ||
            (e?.message || '').includes('connect') ||
            (e?.code || '') === 'ECONNREFUSED'
          );
          if (hasConnectionError) {
            // Silently ignore - Redis is optional
            return;
          }
          errorMsg = err.errors.map(e => e?.message || String(e)).join(', ');
        } else {
          errorMsg = err?.message || String(err) || '';
        }
        errorName = err?.name || '';
        errorCode = err?.code || '';
      }
      
      // Suppress all connection-related errors
      if (errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('connect') || 
          errorMsg.includes('Connection') ||
          errorMsg.includes('ENOTFOUND') ||
          errorName === 'AggregateError' ||
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ENOTFOUND') {
        // Silently ignore - Redis is optional
        return;
      }
      
      // Only log unexpected errors (shouldn't happen now)
      // This is a safety net for truly unexpected errors
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    // Set a timeout for the connection attempt
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    await Promise.race([connectPromise, timeoutPromise]);

    // Create Bull queues after Redis is connected to avoid errors during
    // module import when Redis is not available (which caused ECONNREFUSED).
    try {
      queryQueue = createQueue(QUEUE_NAMES.QUERY_PROCESSING);
      taggingQueue = createQueue(QUEUE_NAMES.TAGging);
      sentimentQueue = createQueue(QUEUE_NAMES.SENTIMENT);
      priorityQueue = createQueue(QUEUE_NAMES.PRIORITY);
      spamQueue = createQueue(QUEUE_NAMES.SPAM_DETECTION);
      notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION);
      
      // Verify queues were created successfully
      if (queryQueue && taggingQueue && sentimentQueue && priorityQueue && spamQueue && notificationQueue) {
        console.log('✅ Queues created');
      } else {
        throw new Error('Some queues failed to create');
      }
    } catch (qErr) {
      console.error('❌ Failed to create queues:', qErr && (qErr.message || qErr));
      // Set all queues to null if creation fails
      queryQueue = null;
      taggingQueue = null;
      sentimentQueue = null;
      priorityQueue = null;
      spamQueue = null;
      notificationQueue = null;
    }

    return redisClient;
  } catch (error) {
    // Clean up the client if it was created
    if (redisClient) {
      try {
        await redisClient.quit().catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
      redisClient = null;
    }
    
    // Only show a simple message, not the full error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('⚠️  Redis not available (optional). Continuing without queue features.');
      console.log('💡 To enable Redis: Install and start Redis server, or set REDIS_HOST in .env');
    } else {
      console.log('⚠️  Redis connection failed. Continuing without queue features.');
    }
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
  try {
    const queue = new Queue(queueName, {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        retryStrategyOnFailover: true,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false, // Disable ready check to avoid connection errors
        connectTimeout: 5000,
        lazyConnect: false,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        }
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
      },
      settings: {
        stalledInterval: 30000,
        maxStalledCount: 1
      }
    });

    // Handle queue connection errors gracefully - suppress ECONNREFUSED errors
    queue.on('error', (error) => {
      const errorMsg = error.message || String(error);
      // Suppress connection refused errors - these are expected when Redis isn't running
      if (!errorMsg.includes('ECONNREFUSED') && 
          !errorMsg.includes('connect') && 
          !errorMsg.includes('Connection') &&
          !errorMsg.includes('ENOTFOUND')) {
        console.error(`Queue ${queueName} error:`, errorMsg);
      }
    });

    // Suppress 'ready' event errors
    queue.on('ready', () => {
      // Queue is ready - this is good
    });

    return queue;
  } catch (error) {
    console.error(`Failed to create queue ${queueName}:`, error.message);
    return null;
  }
}

// Queue instances (created after Redis initialization)
let queryQueue = null;
let taggingQueue = null;
let sentimentQueue = null;
let priorityQueue = null;
let spamQueue = null;
let notificationQueue = null;

/**
 * Add a query to the processing queue
 * @param {Object} queryData - Query data to process
 * @returns {Promise<Job>} Bull job instance
 */
async function addQueryToQueue(queryData) {
  try {
    if (!queryQueue) {
      const msg = 'Query queue not available (Redis not connected)';
      console.warn(msg);
      throw new Error(msg);
    }
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
  if (!taggingQueue) {
    const msg = 'Tagging queue not available (Redis not connected)';
    console.warn(msg);
    throw new Error(msg);
  }
  return await taggingQueue.add('tag-query', { queryId, content });
}

/**
 * Add job to sentiment analysis queue
 */
async function addSentimentJob(queryId, content) {
  if (!sentimentQueue) {
    const msg = 'Sentiment queue not available (Redis not connected)';
    console.warn(msg);
    throw new Error(msg);
  }
  return await sentimentQueue.add('analyze-sentiment', { queryId, content });
}

/**
 * Add job to priority detection queue
 */
async function addPriorityJob(queryId, queryData) {
  if (!priorityQueue) {
    const msg = 'Priority queue not available (Redis not connected)';
    console.warn(msg);
    throw new Error(msg);
  }
  return await priorityQueue.add('detect-priority', { queryId, queryData });
}

/**
 * Add job to spam detection queue
 */
async function addSpamJob(queryId, content, senderEmail) {
  if (!spamQueue) {
    const msg = 'Spam queue not available (Redis not connected)';
    console.warn(msg);
    throw new Error(msg);
  }
  return await spamQueue.add('detect-spam', { queryId, content, senderEmail });
}

/**
 * Add notification job
 */
async function addNotificationJob(type, recipient, data) {
  if (!notificationQueue) {
    const msg = 'Notification queue not available (Redis not connected)';
    console.warn(msg);
    throw new Error(msg);
  }
  return await notificationQueue.add('send-notification', { type, recipient, data });
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

