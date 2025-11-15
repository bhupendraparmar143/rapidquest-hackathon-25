/**
 * Query Detail Page
 * Displays full details of a single query with history and actions
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queryAPI, teamAPI } from '../services/api';
import moment from 'moment';
import './QueryDetail.css';

const QueryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ userId: '', teamId: '' });
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchQuery();
    fetchUsersAndTeams();
  }, [id]);

  const fetchQuery = async () => {
    try {
      const response = await queryAPI.getById(id);
      setQuery(response.data.data);
    } catch (error) {
      console.error('Error fetching query:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndTeams = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        teamAPI.getAllUsers(),
        teamAPI.getAllTeams()
      ]);
      setUsers(usersRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (error) {
      console.error('Error fetching users/teams:', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(true);
    try {
      await queryAPI.updateStatus(id, newStatus, 'current-user-id', 'Status updated via UI');
      await fetchQuery();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignData.userId || !assignData.teamId) {
      alert('Please select both user and team');
      return;
    }
    
    setActionLoading(true);
    try {
      await queryAPI.assign(id, assignData.userId, assignData.teamId, 'current-user-id');
      await fetchQuery();
      setShowAssignModal(false);
      setAssignData({ userId: '', teamId: '' });
    } catch (error) {
      console.error('Error assigning query:', error);
      alert('Failed to assign query');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setActionLoading(true);
    try {
      await queryAPI.autoAssign(id, 'current-user-id');
      await fetchQuery();
    } catch (error) {
      console.error('Error auto-assigning:', error);
      alert('Failed to auto-assign query');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
      return;
    }
    
    setActionLoading(true);
    try {
      await queryAPI.addNote(id, 'Note added', 'current-user-id', noteText);
      setNoteText('');
      await fetchQuery();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading query details...</div>;
  }

  if (!query) {
    return (
      <div className="error">
        <p>Query not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/inbox')}>
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="query-detail">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/inbox')}>
          ← Back to Inbox
        </button>
        <div className="header-actions">
          {query.status === 'new' && (
            <button
              className="btn btn-primary"
              onClick={handleAutoAssign}
              disabled={actionLoading}
            >
              Auto Assign
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setShowAssignModal(true)}
            disabled={actionLoading}
          >
            Manual Assign
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* Main Query Info */}
        <div className="card">
          <div className="query-title-section">
            <h1>{query.subject}</h1>
            <div className="query-badges-header">
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

          <div className="query-meta-info">
            <div className="meta-item">
              <strong>Channel:</strong> {query.channel}
            </div>
            <div className="meta-item">
              <strong>From:</strong> {query.senderName}
              {query.senderEmail && ` (${query.senderEmail})`}
            </div>
            <div className="meta-item">
              <strong>Received:</strong> {moment(query.receivedAt).format('MMMM DD, YYYY HH:mm')}
            </div>
            {query.assignedTo && (
              <div className="meta-item">
                <strong>Assigned To:</strong> {query.assignedTo.name}
              </div>
            )}
            {query.assignedTeam && (
              <div className="meta-item">
                <strong>Team:</strong> {query.assignedTeam.name}
              </div>
            )}
          </div>

          <div className="query-content">
            <h3>Content</h3>
            <p>{query.content}</p>
          </div>

          <div className="query-tags-section">
            <h3>Tags</h3>
            <div className="tags-list">
              {query.tags && query.tags.map(tag => (
                <span key={tag} className="tag-badge">{tag}</span>
              ))}
            </div>
            {query.primaryTag && (
              <p className="primary-tag">Primary Tag: <strong>{query.primaryTag}</strong></p>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="card">
          <h2>Actions</h2>
          <div className="action-buttons">
            {query.status === 'new' && (
              <button
                className="btn btn-success"
                onClick={() => handleStatusUpdate('assigned')}
                disabled={actionLoading}
              >
                Mark as Assigned
              </button>
            )}
            {query.status === 'assigned' && (
              <button
                className="btn btn-success"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={actionLoading}
              >
                Start Working
              </button>
            )}
            {query.status === 'in_progress' && (
              <button
                className="btn btn-success"
                onClick={() => handleStatusUpdate('resolved')}
                disabled={actionLoading}
              >
                Mark as Resolved
              </button>
            )}
            {query.status === 'resolved' && (
              <button
                className="btn btn-secondary"
                onClick={() => handleStatusUpdate('closed')}
                disabled={actionLoading}
              >
                Close Query
              </button>
            )}
          </div>

          <div className="add-note-section">
            <h3>Add Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              rows="4"
            />
            <button
              className="btn btn-primary"
              onClick={handleAddNote}
              disabled={actionLoading || !noteText.trim()}
            >
              Add Note
            </button>
          </div>
        </div>

        {/* History */}
        <div className="card">
          <h2>History</h2>
          <div className="history-list">
            {query.history && query.history.length > 0 ? (
              query.history
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <strong>{entry.action}</strong>
                      <span className="history-time">
                        {moment(entry.timestamp).format('MMM DD, YYYY HH:mm')}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="history-notes">{entry.notes}</p>
                    )}
                    {entry.performedBy && (
                      <p className="history-user">
                        By: {entry.performedBy.name || 'System'}
                      </p>
                    )}
                  </div>
                ))
            ) : (
              <p>No history available</p>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Query</h2>
            <div className="form-group">
              <label>Team</label>
              <select
                value={assignData.teamId}
                onChange={(e) => setAssignData({ ...assignData, teamId: e.target.value })}
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>User</label>
              <select
                value={assignData.userId}
                onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
              >
                <option value="">Select User</option>
                {users
                  .filter(user => !assignData.teamId || user.team === assignData.teamId)
                  .map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={actionLoading}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryDetail;


