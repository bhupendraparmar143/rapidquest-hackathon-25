/**
 * API Service
 * Centralized API client for making HTTP requests to the backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Query API endpoints
 */
export const queryAPI = {
  // Get all queries with filters
  getAll: (params) => api.get('/queries', { params }),
  
  // Get single query by ID
  getById: (id) => api.get(`/queries/${id}`),
  
  // Create new query
  create: (data) => api.post('/queries', data),
  
  // Update query status
  updateStatus: (id, status, userId, notes) => 
    api.patch(`/queries/${id}/status`, { status, userId, notes }),
  
  // Assign query
  assign: (id, userId, teamId, assignedBy) => 
    api.post(`/queries/${id}/assign`, { userId, teamId, assignedBy }),
  
  // Auto-assign query
  autoAssign: (id, assignedBy) => 
    api.post(`/queries/${id}/auto-assign`, { assignedBy }),
  
  // Add note to query
  addNote: (id, action, performedBy, notes) => 
    api.post(`/queries/${id}/notes`, { action, performedBy, notes }),
  
  // Delete query
  delete: (id) => api.delete(`/queries/${id}`)
};

/**
 * Analytics API endpoints
 */
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  
  // Get response time analytics
  getResponseTime: (params) => api.get('/analytics/response-time', { params }),
  
  // Get query type analytics
  getQueryTypes: (params) => api.get('/analytics/query-types', { params }),
  
  // Get team performance analytics
  getTeamPerformance: (params) => api.get('/analytics/team-performance', { params }),
  
  // Get time-based analytics
  getTimeBased: (params) => api.get('/analytics/time-based', { params })
};

/**
 * Team API endpoints
 */
export const teamAPI = {
  // Get all teams
  getAllTeams: () => api.get('/teams/teams'),
  
  // Get team by ID
  getTeamById: (id) => api.get(`/teams/teams/${id}`),
  
  // Create team
  createTeam: (data) => api.post('/teams/teams', data),
  
  // Update team
  updateTeam: (id, data) => api.put(`/teams/teams/${id}`, data),
  
  // Delete team
  deleteTeam: (id) => api.delete(`/teams/teams/${id}`),
  
  // Get all users
  getAllUsers: () => api.get('/teams/users'),
  
  // Get user by ID
  getUserById: (id) => api.get(`/teams/users/${id}`),
  
  // Create user
  createUser: (data) => api.post('/teams/users', data),
  
  // Update user
  updateUser: (id, data) => api.put(`/teams/users/${id}`, data),
  
  // Delete user
  deleteUser: (id) => api.delete(`/teams/users/${id}`)
};

export default api;


