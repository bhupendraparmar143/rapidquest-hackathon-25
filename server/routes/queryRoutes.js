/**
 * Query Routes
 * Defines all API endpoints for query management
 */

const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');

// Create a new query
router.post('/', queryController.createQuery);

// Get all queries with filtering
router.get('/', queryController.getAllQueries);

// Get single query by ID
router.get('/:id', queryController.getQueryById);

// Update query status
router.patch('/:id/status', queryController.updateStatus);

// Assign query
router.post('/:id/assign', queryController.assignQuery);

// Auto-assign query
router.post('/:id/auto-assign', queryController.autoAssignQuery);

// Add note to query
router.post('/:id/notes', queryController.addNote);

// Delete query
router.delete('/:id', queryController.deleteQuery);

module.exports = router;


