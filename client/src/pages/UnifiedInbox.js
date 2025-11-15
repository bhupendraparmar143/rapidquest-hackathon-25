/**
 * Unified Inbox Page
 * Displays all queries with filtering, sorting, and management capabilities
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { queryAPI } from '../services/api';
import moment from 'moment';
import './UnifiedInbox.css';

const UnifiedInbox = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    channel: '',
    tag: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchQueries();
  }, [filters]);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.channel) params.channel = filters.channel;
      if (filters.tag) params.tag = filters.tag;
      params.page = filters.page;
      params.limit = filters.limit;
      params.sortBy = 'receivedAt';
      params.sortOrder = 'desc';

      const response = await queryAPI.getAll(params);
      setQueries(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (queryId, newStatus) => {
    try {
      await queryAPI.updateStatus(queryId, newStatus, 'current-user-id', 'Status updated');
      fetchQueries(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleAutoAssign = async (queryId) => {
    try {
      await queryAPI.autoAssign(queryId, 'current-user-id');
      fetchQueries(); // Refresh list
    } catch (error) {
      console.error('Error auto-assigning:', error);
      alert('Failed to auto-assign query');
    }
  };

  return (
    <div className="unified-inbox">
      <div className="inbox-header">
        <h1>Unified Inbox</h1>
        <Link to="/" className="btn btn-primary">
          Create New Query
        </Link>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="social_media">Social Media</option>
              <option value="chat">Chat</option>
              <option value="community">Community</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tag</label>
            <select
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
            >
              <option value="">All Tags</option>
              <option value="question">Question</option>
              <option value="request">Request</option>
              <option value="complaint">Complaint</option>
              <option value="compliment">Compliment</option>
              <option value="feedback">Feedback</option>
              <option value="technical_issue">Technical Issue</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queries List */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading queries...</div>
        ) : queries.length === 0 ? (
          <div className="no-queries">No queries found</div>
        ) : (
          <>
            <div className="queries-list">
              {queries.map(query => (
                <div key={query._id} className="query-item">
                  <div className="query-header">
                    <div className="query-title-section">
                      <Link to={`/query/${query._id}`} className="query-title">
                        {query.subject}
                      </Link>
                      <div className="query-meta">
                        <span className="query-channel">{query.channel}</span>
                        <span className="query-sender">from {query.senderName}</span>
                        <span className="query-time">
                          {moment(query.receivedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                    <div className="query-badges">
                      <span className={`badge badge-${query.priority}`}>
                        {query.priority}
                      </span>
                      <span className={`badge badge-${query.status}`}>
                        {query.status}
                      </span>
                      {query.isEscalated && (
                        <span className="badge badge-escalated">Escalated</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="query-content-preview">
                    {query.content.substring(0, 150)}...
                  </div>
                  
                  <div className="query-tags">
                    {query.tags && query.tags.map(tag => (
                      <span key={tag} className="tag-badge">{tag}</span>
                    ))}
                  </div>
                  
                  <div className="query-actions">
                    {query.status === 'new' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAutoAssign(query._id)}
                      >
                        Auto Assign
                      </button>
                    )}
                    {query.status === 'assigned' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(query._id, 'in_progress')}
                      >
                        Start Working
                      </button>
                    )}
                    {query.status === 'in_progress' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(query._id, 'resolved')}
                      >
                        Mark Resolved
                      </button>
                    )}
                    <Link
                      to={`/query/${query._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedInbox;


