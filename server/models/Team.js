/**
 * Team Model
 * Represents teams that handle specific types of queries
 */

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Tags/categories this team handles
  handlesTags: [{
    type: String,
    enum: ['question', 'request', 'complaint', 'compliment', 'feedback', 'technical_issue', 'billing', 'other']
  }],
  // Channels this team handles
  handlesChannels: [{
    type: String,
    enum: ['email', 'social_media', 'chat', 'community', 'phone']
  }],
  // Priority levels this team handles
  handlesPriorities: [{
    type: String,
    enum: ['low', 'medium', 'high', 'urgent']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Team statistics
  stats: {
    totalQueries: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number, // in minutes
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
teamSchema.index({ name: 1 });
teamSchema.index({ isActive: 1 });

module.exports = mongoose.model('Team', teamSchema);


