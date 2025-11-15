/**
 * Dashboard Page
 * Displays overview statistics and key metrics
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, queryAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentQueries();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentQueries = async () => {
    try {
      const response = await queryAPI.getAll({ limit: 5, sortBy: 'receivedAt', sortOrder: 'desc' });
      setRecentQueries(response.data.data);
    } catch (error) {
      console.error('Error fetching recent queries:', error);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="error">
          <p>Error loading dashboard data. Please make sure the backend server is running.</p>
          <p>If this is your first time, try running: <code>npm run seed</code> to create sample data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Queries</h3>
          <p className="stat-value">{dashboardData.summary?.totalQueries || 0}</p>
        </div>
        <div className="summary-card">
          <h3>Pending Queries</h3>
          <p className="stat-value">{dashboardData.summary?.pendingQueries || 0}</p>
        </div>
        <div className="summary-card">
          <h3>Escalated</h3>
          <p className="stat-value">{dashboardData.summary?.escalatedQueries || 0}</p>
        </div>
        <div className="summary-card">
          <h3>Avg Response Time</h3>
          <p className="stat-value">
            {formatTime(dashboardData.responseTime?.averageResponseTime || 0)}
          </p>
        </div>
      </div>

      {/* Query Type Distribution */}
      <div className="card">
        <h2>Query Types Distribution</h2>
        {dashboardData.queryTypes && dashboardData.queryTypes.primaryTagDistribution && 
         Object.keys(dashboardData.queryTypes.primaryTagDistribution).length > 0 ? (
          <div className="tag-distribution">
            {Object.entries(dashboardData.queryTypes.primaryTagDistribution).map(([tag, count]) => (
              <div key={tag} className="tag-item">
                <span className="tag-name">{tag}</span>
                <span className="tag-count">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No query type data available</p>
        )}
      </div>

      {/* Channel Distribution */}
      <div className="card">
        <h2>Channel Distribution</h2>
        {dashboardData.queryTypes && dashboardData.queryTypes.channelDistribution && 
         Object.keys(dashboardData.queryTypes.channelDistribution).length > 0 ? (
          <div className="channel-distribution">
            {Object.entries(dashboardData.queryTypes.channelDistribution).map(([channel, count]) => (
              <div key={channel} className="channel-item">
                <span className="channel-name">{channel}</span>
                <span className="channel-count">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No channel data available</p>
        )}
      </div>

      {/* Recent Queries */}
      <div className="card">
        <h2>Recent Queries</h2>
        <div className="recent-queries">
          {recentQueries.length === 0 ? (
            <p>No queries yet</p>
          ) : (
            <table className="queries-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Channel</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentQueries.map(query => (
                  <tr key={query._id}>
                    <td>
                      <Link to={`/query/${query._id}`}>{query.subject}</Link>
                    </td>
                    <td>{query.channel}</td>
                    <td>
                      <span className={`badge badge-${query.priority}`}>
                        {query.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${query.status}`}>
                        {query.status}
                      </span>
                    </td>
                    <td>{new Date(query.receivedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Link to="/inbox" className="btn btn-primary">
          View All Queries
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

