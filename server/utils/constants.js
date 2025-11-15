/**
 * Application Constants
 * Centralized constants used throughout the application
 */

// Supported channels
exports.SUPPORTED_CHANNELS = [
  'email',
  'social_media',
  'chat',
  'community',
  'phone'
];

// Query statuses
exports.QUERY_STATUSES = [
  'new',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'escalated'
];

// Priority levels
exports.PRIORITY_LEVELS = [
  'low',
  'medium',
  'high',
  'urgent'
];

// Tag categories
exports.TAG_CATEGORIES = [
  'question',
  'request',
  'complaint',
  'compliment',
  'feedback',
  'technical_issue',
  'billing',
  'other'
];

// User roles
exports.USER_ROLES = [
  'admin',
  'manager',
  'agent',
  'specialist'
];

// Priority response time thresholds (in hours)
exports.PRIORITY_RESPONSE_TIMES = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72
};

// Escalation thresholds (in hours)
exports.ESCALATION_THRESHOLDS = {
  urgent: 1,
  high: 4,
  medium: 12,
  low: 24
};


