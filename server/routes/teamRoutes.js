/**
 * Team Routes
 * Defines all API endpoints for team and user management
 */

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Team routes
router.post('/teams', teamController.createTeam);
router.get('/teams', teamController.getAllTeams);
router.get('/teams/:id', teamController.getTeamById);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

// User routes
router.post('/users', teamController.createUser);
router.get('/users', teamController.getAllUsers);
router.get('/users/:id', teamController.getUserById);
router.put('/users/:id', teamController.updateUser);
router.delete('/users/:id', teamController.deleteUser);

module.exports = router;


