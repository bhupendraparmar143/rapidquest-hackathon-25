/**
 * Analytics Controller
 * Handles all HTTP requests related to analytics and reporting
 */

const analyticsService = require('../services/analyticsService');

/**
 * Get comprehensive dashboard analytics
 * GET /api/analytics/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status
    };
    
    const analytics = await analyticsService.getDashboardAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
};

/**
 * Get response time analytics
 * GET /api/analytics/response-time
 */
exports.getResponseTime = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status
    };
    
    const analytics = await analyticsService.getResponseTimeAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching response time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching response time analytics',
      error: error.message
    });
  }
};

/**
 * Get query type analytics
 * GET /api/analytics/query-types
 */
exports.getQueryTypes = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const analytics = await analyticsService.getQueryTypeAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching query type analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching query type analytics',
      error: error.message
    });
  }
};

/**
 * Get team performance analytics
 * GET /api/analytics/team-performance
 */
exports.getTeamPerformance = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const analytics = await analyticsService.getTeamPerformanceAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching team performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team performance analytics',
      error: error.message
    });
  }
};

/**
 * Get time-based analytics
 * GET /api/analytics/time-based
 */
exports.getTimeBased = async (req, res) => {
  try {
    const period = req.query.period || 'day';
    const count = parseInt(req.query.count) || 7;
    
    const analytics = await analyticsService.getTimeBasedAnalytics(period, count);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching time-based analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time-based analytics',
      error: error.message
    });
  }
};


