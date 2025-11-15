/**
 * Analytics Routes
 * Defines all API endpoints for analytics and reporting
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Get dashboard analytics
router.get('/dashboard', analyticsController.getDashboard);

// Get response time analytics
router.get('/response-time', analyticsController.getResponseTime);

// Get query type analytics
router.get('/query-types', analyticsController.getQueryTypes);

// Get team performance analytics
router.get('/team-performance', analyticsController.getTeamPerformance);

// Get time-based analytics
router.get('/time-based', analyticsController.getTimeBased);

module.exports = router;


