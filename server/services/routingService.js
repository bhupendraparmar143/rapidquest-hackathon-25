/**
 * Routing & Assignment Service
 * Automatically routes queries to appropriate teams/users based on tags, priority, and workload
 */

const Query = require('../models/Query');
const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Finds the best team to handle a query based on tags, channels, and priorities
 * @param {Object} query - Query document
 * @returns {Promise<Object|null>} - Best matching team or null
 */
async function findBestTeam(query) {
  const teams = await Team.find({ isActive: true });
  
  let bestTeam = null;
  let bestScore = 0;
  
  for (const team of teams) {
    let score = 0;
    
    // Score based on tag matching
    if (query.primaryTag && team.handlesTags.includes(query.primaryTag)) {
      score += 10;
    }
    
    // Score based on channel matching
    if (team.handlesChannels.includes(query.channel)) {
      score += 8;
    }
    
    // Score based on priority matching
    if (team.handlesPriorities.includes(query.priority)) {
      score += 5;
    }
    
    // Prefer teams with lower current workload (more available capacity)
    const teamQueryCount = await Query.countDocuments({
      assignedTeam: team._id,
      status: { $in: ['assigned', 'in_progress'] }
    });
    score -= teamQueryCount * 0.5; // Penalize teams with high workload
    
    if (score > bestScore) {
      bestScore = score;
      bestTeam = team;
    }
  }
  
  return bestTeam;
}

/**
 * Finds the best user to assign a query within a team
 * @param {Object} team - Team document
 * @param {Object} query - Query document
 * @returns {Promise<Object|null>} - Best matching user or null
 */
async function findBestUser(team, query) {
  const users = await User.find({
    team: team._id,
    isActive: true
  });
  
  if (users.length === 0) {
    return null;
  }
  
  let bestUser = null;
  let bestScore = -Infinity;
  
  for (const user of users) {
    let score = 0;
    
    // Check current workload (lower is better)
    const userQueryCount = await Query.countDocuments({
      assignedTo: user._id,
      status: { $in: ['assigned', 'in_progress'] }
    });
    score -= userQueryCount * 10; // Strongly penalize high workload
    
    // Prefer users with better average response time
    if (user.stats && user.stats.averageResponseTime > 0) {
      score += 100 / user.stats.averageResponseTime; // Higher score for faster response
    }
    
    // Role-based scoring (specialists might be better for certain queries)
    if (user.role === 'specialist') {
      score += 5;
    } else if (user.role === 'manager') {
      score += 3;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestUser = user;
    }
  }
  
  return bestUser || users[0]; // Fallback to first user if no best match
}

/**
 * Automatically routes and assigns a query
 * @param {Object} query - Query document
 * @param {Object} assignedBy - User who triggered the assignment (or null for auto)
 * @returns {Promise<Object>} - Updated query document
 */
async function autoRouteAndAssign(query, assignedBy = null) {
  // Find best team
  const team = await findBestTeam(query);
  
  if (!team) {
    // No team found, leave unassigned
    query.history.push({
      action: 'Auto-routing attempted',
      performedBy: assignedBy,
      notes: 'No suitable team found for auto-assignment'
    });
    return query.save();
  }
  
  // Find best user in team
  const user = await findBestUser(team, query);
  
  if (!user) {
    // No user found, assign to team only
    query.assignedTeam = team._id;
    query.status = 'assigned';
    query.history.push({
      action: 'Assigned to team',
      performedBy: assignedBy,
      notes: `Auto-assigned to team: ${team.name} (no available users)`
    });
    return query.save();
  }
  
  // Assign to both team and user
  await query.assign(user._id, team._id, assignedBy);
  
  query.history.push({
    action: 'Auto-assigned',
    performedBy: assignedBy,
    notes: `Auto-assigned to ${user.name} in team ${team.name}`
  });
  
  // Update user stats
  user.stats.totalAssigned += 1;
  await user.save();
  
  // Update team stats
  team.stats.totalQueries += 1;
  await team.save();
  
  return query.save();
}

/**
 * Manually assigns a query to a specific user/team
 * @param {Object} query - Query document
 * @param {string} userId - User ID to assign to
 * @param {string} teamId - Team ID to assign to
 * @param {string} assignedBy - User ID who is making the assignment
 * @returns {Promise<Object>} - Updated query document
 */
async function manualAssign(query, userId, teamId, assignedBy) {
  await query.assign(userId, teamId, assignedBy);
  
  query.history.push({
    action: 'Manually assigned',
    performedBy: assignedBy,
    notes: `Manually assigned by user ${assignedBy}`
  });
  
  // Update user and team stats
  const user = await User.findById(userId);
  if (user) {
    user.stats.totalAssigned += 1;
    await user.save();
  }
  
  const team = await Team.findById(teamId);
  if (team) {
    team.stats.totalQueries += 1;
    await team.save();
  }
  
  return query.save();
}

module.exports = {
  findBestTeam,
  findBestUser,
  autoRouteAndAssign,
  manualAssign
};


