/**
 * Worker Service Entry Point
 * Processes jobs from BullMQ queues
 * Handles: tagging, sentiment analysis, priority detection, spam detection
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const {
  queryQueue,
  taggingQueue,
  sentimentQueue,
  priorityQueue,
  spamQueue
} = require('../services/queueService');
const taggingService = require('../services/taggingService');
const priorityService = require('../services/priorityService');
const Query = require('../models/Query');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/query_management';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Worker: Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ Worker: MongoDB connection error:', error.message);
  process.exit(1);
});

// Initialize Redis for queue
const { initRedis } = require('../services/queueService');
initRedis().then(() => {
  console.log('✅ Worker: Queue service initialized');
}).catch(err => {
  console.error('⚠️  Worker: Redis not available, continuing without queue features');
});

/**
 * Sentiment Analysis Service
 */
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function analyzeSentiment(text) {
  const result = sentiment.analyze(text);
  return {
    score: result.score,
    comparative: result.comparative,
    sentiment: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral',
    tokens: result.tokens,
    words: result.words
  };
}

/**
 * Spam Detection Service (basic implementation)
 */
function detectSpam(content, senderEmail) {
  const spamKeywords = [
    'click here', 'limited time', 'act now', 'urgent action required',
    'congratulations', 'you have won', 'free money', 'nigerian prince',
    'viagra', 'cialis', 'weight loss', 'get rich quick'
  ];

  const lowerContent = content.toLowerCase();
  let spamScore = 0;

  spamKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      spamScore += 1;
    }
  });

  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    spamScore += 2;
  }

  // Check for excessive links
  const linkCount = (content.match(/http/gi) || []).length;
  if (linkCount > 3) {
    spamScore += 2;
  }

  return {
    isSpam: spamScore >= 3,
    spamScore: spamScore,
    confidence: Math.min(spamScore / 5, 1)
  };
}

// ========== QUEUE WORKERS ==========

/**
 * Main Query Processing Worker
 */
queryQueue.process('process-query', async (job) => {
  const { queryId } = job.data;
  console.log(`🔄 Processing query ${queryId}`);

  try {
    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    // Trigger all processing jobs in parallel
    await Promise.all([
      taggingQueue.add('tag-query', { queryId, content: query.content, subject: query.subject }),
      sentimentQueue.add('analyze-sentiment', { queryId, content: query.content }),
      priorityQueue.add('detect-priority', { queryId, queryData: query.toObject() }),
      spamQueue.add('detect-spam', { queryId, content: query.content, senderEmail: query.senderEmail })
    ]);

    console.log(`✅ Query ${queryId} queued for processing`);
    return { success: true, queryId };
  } catch (error) {
    console.error(`❌ Error processing query ${queryId}:`, error);
    throw error;
  }
});

/**
 * Tagging Worker
 */
taggingQueue.process('tag-query', async (job) => {
  const { queryId, content, subject } = job.data;
  console.log(`🏷️  Tagging query ${queryId}`);

  try {
    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    // Apply auto-tagging
    await taggingService.applyTagsToQuery(query);
    
    console.log(`✅ Query ${queryId} tagged: ${query.tags.join(', ')}`);
    return { success: true, tags: query.tags, primaryTag: query.primaryTag };
  } catch (error) {
    console.error(`❌ Error tagging query ${queryId}:`, error);
    throw error;
  }
});

/**
 * Sentiment Analysis Worker
 */
sentimentQueue.process('analyze-sentiment', async (job) => {
  const { queryId, content } = job.data;
  console.log(`😊 Analyzing sentiment for query ${queryId}`);

  try {
    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    const sentimentResult = analyzeSentiment(content);
    
    // Store sentiment in metadata
    if (!query.metadata) {
      query.metadata = new Map();
    }
    query.metadata.set('sentiment', sentimentResult);
    
    await query.save();
    
    console.log(`✅ Query ${queryId} sentiment: ${sentimentResult.sentiment} (score: ${sentimentResult.score})`);
    return { success: true, sentiment: sentimentResult };
  } catch (error) {
    console.error(`❌ Error analyzing sentiment for query ${queryId}:`, error);
    throw error;
  }
});

/**
 * Priority Detection Worker
 */
priorityQueue.process('detect-priority', async (job) => {
  const { queryId, queryData } = job.data;
  console.log(`⚡ Detecting priority for query ${queryId}`);

  try {
    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    // Apply priority detection
    await priorityService.applyPriorityToQuery(query);
    
    console.log(`✅ Query ${queryId} priority: ${query.priority} (score: ${query.priorityScore})`);
    return { success: true, priority: query.priority, priorityScore: query.priorityScore };
  } catch (error) {
    console.error(`❌ Error detecting priority for query ${queryId}:`, error);
    throw error;
  }
});

/**
 * Spam Detection Worker
 */
spamQueue.process('detect-spam', async (job) => {
  const { queryId, content, senderEmail } = job.data;
  console.log(`🛡️  Detecting spam for query ${queryId}`);

  try {
    const query = await Query.findById(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    const spamResult = detectSpam(content, senderEmail);
    
    // Store spam detection in metadata
    if (!query.metadata) {
      query.metadata = new Map();
    }
    query.metadata.set('spamDetection', spamResult);
    
    // Mark as spam if detected
    if (spamResult.isSpam) {
      query.status = 'closed';
      query.history.push({
        action: 'Auto-closed as spam',
        performedBy: null,
        notes: `Spam score: ${spamResult.spamScore}, Confidence: ${(spamResult.confidence * 100).toFixed(0)}%`
      });
    }
    
    await query.save();
    
    console.log(`✅ Query ${queryId} spam check: ${spamResult.isSpam ? 'SPAM' : 'CLEAN'} (score: ${spamResult.spamScore})`);
    return { success: true, spam: spamResult };
  } catch (error) {
    console.error(`❌ Error detecting spam for query ${queryId}:`, error);
    throw error;
  }
});

// Handle worker errors
[queryQueue, taggingQueue, sentimentQueue, priorityQueue, spamQueue].forEach(queue => {
  queue.on('error', (error) => {
    console.error(`❌ Queue error:`, error);
  });

  queue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });

  queue.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
});

// Import notification worker
require('./notificationWorker');

console.log('🚀 Workers started and listening for jobs...');
console.log('📋 Active queues: query-processing, tagging, sentiment, priority, spam-detection, notification');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down workers...');
  await Promise.all([
    queryQueue.close(),
    taggingQueue.close(),
    sentimentQueue.close(),
    priorityQueue.close(),
    spamQueue.close()
  ]);
  await mongoose.connection.close();
  process.exit(0);
});

