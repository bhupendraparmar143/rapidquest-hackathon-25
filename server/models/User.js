/**
 * User Model
 * Represents team members who can be assigned queries
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false, // Optional for existing users, required for new registrations
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'agent', 'specialist', 'lead'],
    default: 'agent'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Statistics
  stats: {
    totalAssigned: {
      type: Number,
      default: 0
    },
    totalResolved: {
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
userSchema.index({ email: 1 });
userSchema.index({ team: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);


