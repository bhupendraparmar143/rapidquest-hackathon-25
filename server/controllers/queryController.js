/**
 * Query Controller
 * Handles all HTTP requests related to query management
 */

const Query = require('../models/Query');
const taggingService = require('../services/taggingService');
const priorityService = require('../services/priorityService');
const routingService = require('../services/routingService');
const { notifyQueryAssignment } = require('../services/notificationService');

/**
 * Create a new query
 * POST /api/queries
 */
exports.createQuery = async (req, res) => {
  try {
    const { subject, content, channel, senderName, senderEmail, senderId, metadata } = req.body;
    
    // Validate required fields
    if (!subject || !content || !channel || !senderName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, content, channel, senderName'
      });
    }
    
    // Validate channel
    const validChannels = ['email', 'social_media', 'chat', 'community', 'phone'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
      });
    }
    
    // Create new query
    const query = new Query({
      subject,
      content,
      channel,
      senderName,
      senderEmail,
      senderId,
      metadata: metadata || {}
    });
    
    // Auto-tagging
    await taggingService.applyTagsToQuery(query);
    
    // Priority detection
    await priorityService.applyPriorityToQuery(query);
    
    // Auto-assignment (if enabled)
    const autoAssign = req.body.autoAssign !== false; // Default to true
    if (autoAssign) {
      await routingService.autoRouteAndAssign(query);
    }
    
    await query.save();
    
    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('query:created', query);
      if (query.assignedTeam) {
        io.to(`team-${query.assignedTeam}`).emit('query:new', query);
      }
    }
    
    res.status(201).json({
      success: true,
      data: query,
      message: 'Query created successfully'
    });
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating query',
      error: error.message
    });
  }
};

/**
 * Get all queries with filtering and pagination
 * GET /api/queries
 */
exports.getAllQueries = async (req, res) => {
  try {
    const {
      status,
      priority,
      channel,
      tag,
      assignedTo,
      assignedTeam,
      isEscalated,
      page = 1,
      limit = 20,
      sortBy = 'receivedAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (channel) filter.channel = channel;
    if (tag) filter.tags = tag;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (assignedTeam) filter.assignedTeam = assignedTeam;
    if (isEscalated !== undefined) filter.isEscalated = isEscalated === 'true';
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const queries = await Query.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Query.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: queries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queries',
      error: error.message
    });
  }
};

/**
 * Get a single query by ID
 * GET /api/queries/:id
 */
exports.getQueryById = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name description')
      .populate('history.performedBy', 'name email');
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: query
    });
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching query',
      error: error.message
    });
  }
};

/**
 * Update query status
 * PATCH /api/queries/:id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { userId } = req.body; // User performing the action
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    // Track first response time
    if (status === 'in_progress' && !query.firstResponseAt) {
      query.firstResponseAt = new Date();
      query.responseTime = Math.floor((Date.now() - query.receivedAt) / (1000 * 60));
    }
    
    await query.updateStatus(status, userId, notes);
    
    res.status(200).json({
      success: true,
      data: query,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

/**
 * Assign query to user/team
 * POST /api/queries/:id/assign
 */
exports.assignQuery = async (req, res) => {
  try {
    const { userId, teamId, assignedBy } = req.body;
    
    if (!userId || !teamId || !assignedBy) {
      return res.status(400).json({
        success: false,
        message: 'userId, teamId, and assignedBy are required'
      });
    }
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    await routingService.manualAssign(query, userId, teamId, assignedBy);
    
    // Get user details for notification
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Send notification
    if (user && user.email) {
      await notifyQueryAssignment(user.email, user.name, query);
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`query-${query._id}`).emit('query:assigned', query);
      if (teamId) {
        io.to(`team-${teamId}`).emit('query:assigned-to-team', query);
      }
    }
    
    res.status(200).json({
      success: true,
      data: query,
      message: 'Query assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning query:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning query',
      error: error.message
    });
  }
};

/**
 * Auto-assign query
 * POST /api/queries/:id/auto-assign
 */
exports.autoAssignQuery = async (req, res) => {
  try {
    const { assignedBy } = req.body;
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    await routingService.autoRouteAndAssign(query, assignedBy);
    
    res.status(200).json({
      success: true,
      data: query,
      message: 'Query auto-assigned successfully'
    });
  } catch (error) {
    console.error('Error auto-assigning query:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-assigning query',
      error: error.message
    });
  }
};

/**
 * Add note/history entry to query
 * POST /api/queries/:id/notes
 */
exports.addNote = async (req, res) => {
  try {
    const { action, notes, performedBy } = req.body;
    
    if (!action || !performedBy) {
      return res.status(400).json({
        success: false,
        message: 'action and performedBy are required'
      });
    }
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    query.history.push({
      action,
      performedBy,
      notes: notes || ''
    });
    
    await query.save();
    
    res.status(200).json({
      success: true,
      data: query,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
};

/**
 * Delete query
 * DELETE /api/queries/:id
 */
exports.deleteQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Query deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting query',
      error: error.message
    });
  }
};


