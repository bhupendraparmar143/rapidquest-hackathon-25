/**
 * Priority Detection & Escalation Service
 * Automatically determines query priority based on content, tags, and keywords
 * Handles escalation of overdue queries
 */

const moment = require('moment');

// Priority keywords and their weights
const PRIORITY_KEYWORDS = {
  urgent: {
    keywords: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'as soon as possible', 'right now'],
    weight: 10
  },
  high: {
    keywords: ['important', 'soon', 'quickly', 'fast', 'priority', 'significant'],
    weight: 7
  },
  medium: {
    keywords: ['normal', 'regular', 'standard'],
    weight: 4
  },
  low: {
    keywords: ['whenever', 'no rush', 'low priority', 'not urgent'],
    weight: 2
  }
};

// Tag-based priority mapping
const TAG_PRIORITY_MAP = {
  complaint: 'high',
  technical_issue: 'high',
  billing: 'high',
  question: 'medium',
  request: 'medium',
  feedback: 'low',
  compliment: 'low',
  other: 'medium'
};

// Channel-based priority adjustment
const CHANNEL_PRIORITY_MAP = {
  phone: 1.5,      // Phone calls are typically more urgent
  chat: 1.3,       // Live chat is usually time-sensitive
  email: 1.0,      // Standard priority
  social_media: 1.2, // Social media can be urgent for reputation
  community: 0.8   // Community forums are less urgent
};

/**
 * Calculates priority score and determines priority level
 * @param {Object} query - Query object with subject, content, tags, channel
 * @returns {Object} - Object containing priority level and score
 */
function detectPriority(query) {
  const combinedText = `${query.subject} ${query.content}`.toLowerCase();
  let priorityScore = 50; // Base score (medium)
  
  // Check for priority keywords
  Object.keys(PRIORITY_KEYWORDS).forEach(level => {
    PRIORITY_KEYWORDS[level].keywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        priorityScore += PRIORITY_KEYWORDS[level].weight;
      }
    });
  });
  
  // Adjust based on primary tag
  if (query.primaryTag && TAG_PRIORITY_MAP[query.primaryTag]) {
    const tagPriority = TAG_PRIORITY_MAP[query.primaryTag];
    if (tagPriority === 'urgent') priorityScore += 20;
    else if (tagPriority === 'high') priorityScore += 10;
    else if (tagPriority === 'low') priorityScore -= 10;
  }
  
  // Adjust based on channel
  if (query.channel && CHANNEL_PRIORITY_MAP[query.channel]) {
    priorityScore *= CHANNEL_PRIORITY_MAP[query.channel];
  }
  
  // Check for complaint indicators (usually high priority)
  if (query.tags && query.tags.includes('complaint')) {
    priorityScore += 15;
  }
  
  // Normalize score to 0-100 range
  priorityScore = Math.max(0, Math.min(100, priorityScore));
  
  // Determine priority level based on score
  let priority = 'medium';
  if (priorityScore >= 80) {
    priority = 'urgent';
  } else if (priorityScore >= 60) {
    priority = 'high';
  } else if (priorityScore >= 30) {
    priority = 'medium';
  } else {
    priority = 'low';
  }
  
  return {
    priority: priority,
    priorityScore: Math.round(priorityScore)
  };
}

/**
 * Applies priority detection to a query
 * @param {Object} query - Mongoose query document
 * @returns {Promise<Object>} - Updated query document
 */
async function applyPriorityToQuery(query) {
  const priorityResult = detectPriority(query);
  
  query.priority = priorityResult.priority;
  query.priorityScore = priorityResult.priorityScore;
  
  // Log priority detection in history
  query.history.push({
    action: 'Priority detected',
    performedBy: null, // System action
    notes: `Priority: ${priorityResult.priority} (Score: ${priorityResult.priorityScore})`
  });
  
  return query.save();
}

/**
 * Checks if query should be escalated based on response time
 * @param {Object} query - Query document
 * @param {number} escalationThresholdHours - Hours before escalation (default: 24)
 * @returns {boolean} - True if query should be escalated
 */
function shouldEscalate(query, escalationThresholdHours = 24) {
  // Don't escalate if already resolved or closed
  if (['resolved', 'closed'].includes(query.status)) {
    return false;
  }
  
  // Don't escalate if already escalated
  if (query.isEscalated) {
    return false;
  }
  
  const hoursSinceReceived = moment().diff(moment(query.receivedAt), 'hours');
  
  // Escalate based on priority and time
  const priorityThresholds = {
    urgent: 1,    // Escalate after 1 hour
    high: 4,      // Escalate after 4 hours
    medium: 12,   // Escalate after 12 hours
    low: 24       // Escalate after 24 hours
  };
  
  const threshold = priorityThresholds[query.priority] || escalationThresholdHours;
  
  return hoursSinceReceived >= threshold;
}

/**
 * Escalates a query
 * @param {Object} query - Query document
 * @returns {Promise<Object>} - Updated query document
 */
async function escalateQuery(query) {
  if (query.isEscalated) {
    return query;
  }
  
  query.isEscalated = true;
  query.escalatedAt = new Date();
  query.status = 'escalated';
  query.escalationReason = `Auto-escalated due to ${query.priority} priority and response time`;
  
  query.history.push({
    action: 'Query escalated',
    performedBy: null, // System action
    notes: query.escalationReason
  });
  
  return query.save();
}

/**
 * Processes escalation for all pending queries
 * @param {Object} Query - Mongoose Query model
 * @returns {Promise<Array>} - Array of escalated queries
 */
async function processEscalations(Query) {
  const pendingQueries = await Query.find({
    status: { $in: ['new', 'assigned', 'in_progress'] },
    isEscalated: false
  });
  
  const escalatedQueries = [];
  
  for (const query of pendingQueries) {
    if (shouldEscalate(query)) {
      await escalateQuery(query);
      escalatedQueries.push(query);
    }
  }
  
  return escalatedQueries;
}

module.exports = {
  detectPriority,
  applyPriorityToQuery,
  shouldEscalate,
  escalateQuery,
  processEscalations
};


