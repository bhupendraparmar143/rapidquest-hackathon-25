/**
 * Analytics Service
 * Provides analytics on response times, query types, and system performance
 */

const Query = require('../models/Query');
const moment = require('moment');

/**
 * Calculates average response time for queries
 * @param {Object} filters - Optional filters (date range, status, etc.)
 * @returns {Promise<Object>} - Analytics object with response time metrics
 */
async function getResponseTimeAnalytics(filters = {}) {
  const queryFilters = {};
  
  // Apply date range filter if provided
  if (filters.startDate || filters.endDate) {
    queryFilters.receivedAt = {};
    if (filters.startDate) {
      queryFilters.receivedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      queryFilters.receivedAt.$lte = new Date(filters.endDate);
    }
  }
  
  // Apply status filter if provided
  if (filters.status) {
    queryFilters.status = filters.status;
  }
  
  const queries = await Query.find(queryFilters);
  
  let totalResponseTime = 0;
  let totalResolutionTime = 0;
  let queriesWithResponse = 0;
  let queriesWithResolution = 0;
  
  queries.forEach(query => {
    if (query.responseTime !== null) {
      totalResponseTime += query.responseTime;
      queriesWithResponse++;
    }
    if (query.resolutionTime !== null) {
      totalResolutionTime += query.resolutionTime;
      queriesWithResolution++;
    }
  });
  
  const avgResponseTime = queriesWithResponse > 0 
    ? Math.round(totalResponseTime / queriesWithResponse) 
    : 0;
  
  const avgResolutionTime = queriesWithResolution > 0
    ? Math.round(totalResolutionTime / queriesWithResolution)
    : 0;
  
  return {
    averageResponseTime: avgResponseTime, // in minutes
    averageResolutionTime: avgResolutionTime, // in minutes
    queriesWithResponse: queriesWithResponse,
    queriesWithResolution: queriesWithResolution,
    totalQueries: queries.length
  };
}

/**
 * Gets analytics on query types (tags)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Analytics object with tag distribution
 */
async function getQueryTypeAnalytics(filters = {}) {
  const queryFilters = {};
  
  if (filters.startDate || filters.endDate) {
    queryFilters.receivedAt = {};
    if (filters.startDate) {
      queryFilters.receivedAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      queryFilters.receivedAt.$lte = new Date(filters.endDate);
    }
  }
  
  const queries = await Query.find(queryFilters);
  
  const tagCounts = {};
  const primaryTagCounts = {};
  const channelCounts = {};
  const priorityCounts = {};
  const statusCounts = {};
  
  queries.forEach(query => {
    // Count tags
    if (query.tags && query.tags.length > 0) {
      query.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
    
    // Count primary tags
    if (query.primaryTag) {
      primaryTagCounts[query.primaryTag] = (primaryTagCounts[query.primaryTag] || 0) + 1;
    }
    
    // Count channels
    channelCounts[query.channel] = (channelCounts[query.channel] || 0) + 1;
    
    // Count priorities
    priorityCounts[query.priority] = (priorityCounts[query.priority] || 0) + 1;
    
    // Count statuses
    statusCounts[query.status] = (statusCounts[query.status] || 0) + 1;
  });
  
  return {
    tagDistribution: tagCounts,
    primaryTagDistribution: primaryTagCounts,
    channelDistribution: channelCounts,
    priorityDistribution: priorityCounts,
    statusDistribution: statusCounts,
    totalQueries: queries.length
  };
}

/**
 * Gets analytics on team performance
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of team performance objects
 */
async function getTeamPerformanceAnalytics(filters = {}) {
  const Team = require('../models/Team');
  const teams = await Team.find({ isActive: true });
  
  const teamPerformance = [];
  
  for (const team of teams) {
    const queryFilters = { assignedTeam: team._id };
    
    if (filters.startDate || filters.endDate) {
      queryFilters.receivedAt = {};
      if (filters.startDate) {
        queryFilters.receivedAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        queryFilters.receivedAt.$lte = new Date(filters.endDate);
      }
    }
    
    const teamQueries = await Query.find(queryFilters);
    
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let queriesWithResponse = 0;
    let queriesWithResolution = 0;
    
    teamQueries.forEach(query => {
      if (query.responseTime !== null) {
        totalResponseTime += query.responseTime;
        queriesWithResponse++;
      }
      if (query.resolutionTime !== null) {
        totalResolutionTime += query.resolutionTime;
        queriesWithResolution++;
      }
    });
    
    const avgResponseTime = queriesWithResponse > 0
      ? Math.round(totalResponseTime / queriesWithResponse)
      : 0;
    
    const avgResolutionTime = queriesWithResolution > 0
      ? Math.round(totalResolutionTime / queriesWithResolution)
      : 0;
    
    teamPerformance.push({
      teamId: team._id,
      teamName: team.name,
      totalQueries: teamQueries.length,
      averageResponseTime: avgResponseTime,
      averageResolutionTime: avgResolutionTime,
      resolvedQueries: teamQueries.filter(q => q.status === 'resolved' || q.status === 'closed').length
    });
  }
  
  return teamPerformance;
}

/**
 * Gets time-based analytics (queries over time)
 * @param {string} period - 'day', 'week', 'month'
 * @param {number} count - Number of periods to analyze
 * @returns {Promise<Array>} - Array of time-based data points
 */
async function getTimeBasedAnalytics(period = 'day', count = 7) {
  const dataPoints = [];
  const now = moment();
  
  for (let i = count - 1; i >= 0; i--) {
    const startDate = moment(now).subtract(i + 1, period).startOf(period);
    const endDate = moment(now).subtract(i, period).endOf(period);
    
    const queries = await Query.find({
      receivedAt: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    });
    
    dataPoints.push({
      period: startDate.format('YYYY-MM-DD'),
      count: queries.length,
      resolved: queries.filter(q => q.status === 'resolved' || q.status === 'closed').length,
      escalated: queries.filter(q => q.isEscalated).length
    });
  }
  
  return dataPoints;
}

/**
 * Gets comprehensive dashboard analytics
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Complete analytics dashboard data
 */
async function getDashboardAnalytics(filters = {}) {
  const [responseTime, queryTypes, teamPerformance, timeBased] = await Promise.all([
    getResponseTimeAnalytics(filters),
    getQueryTypeAnalytics(filters),
    getTeamPerformanceAnalytics(filters),
    getTimeBasedAnalytics('day', 7)
  ]);
  
  // Get pending queries count
  const pendingQueries = await Query.countDocuments({
    status: { $in: ['new', 'assigned', 'in_progress'] }
  });
  
  // Get escalated queries count
  const escalatedQueries = await Query.countDocuments({
    isEscalated: true,
    status: { $ne: 'closed' }
  });
  
  return {
    responseTime,
    queryTypes,
    teamPerformance,
    timeBased,
    summary: {
      pendingQueries,
      escalatedQueries,
      totalQueries: queryTypes.totalQueries
    }
  };
}

module.exports = {
  getResponseTimeAnalytics,
  getQueryTypeAnalytics,
  getTeamPerformanceAnalytics,
  getTimeBasedAnalytics,
  getDashboardAnalytics
};


