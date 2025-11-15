/**
 * Analytics Page
 * Displays comprehensive analytics and reports
 */

import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await analyticsAPI.getDashboard(params);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Prepare data for charts
  const prepareTagData = () => {
    if (!analytics || !analytics.queryTypes || !analytics.queryTypes.primaryTagDistribution) return [];
    return Object.entries(analytics.queryTypes.primaryTagDistribution).map(([tag, count]) => ({
      name: tag,
      value: count
    }));
  };

  const prepareChannelData = () => {
    if (!analytics || !analytics.queryTypes || !analytics.queryTypes.channelDistribution) return [];
    return Object.entries(analytics.queryTypes.channelDistribution).map(([channel, count]) => ({
      name: channel,
      value: count
    }));
  };

  const preparePriorityData = () => {
    if (!analytics || !analytics.queryTypes || !analytics.queryTypes.priorityDistribution) return [];
    return Object.entries(analytics.queryTypes.priorityDistribution).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  const prepareTimeBasedData = () => {
    if (!analytics || !analytics.timeBased) return [];
    return analytics.timeBased.map(item => ({
      date: item.period,
      total: item.count,
      resolved: item.resolved,
      escalated: item.escalated
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return (
      <div className="analytics-page">
        <h1>Analytics & Reports</h1>
        <div className="error">
          <p>Error loading analytics. Please make sure the backend server is running.</p>
          <p>If this is your first time, try running: <code>npm run seed</code> to create sample data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <h1>Analytics & Reports</h1>

      {/* Date Range Filter */}
      <div className="card">
        <h3>Date Range Filter</h3>
        <div className="date-filters">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Response Time Metrics */}
      <div className="card">
        <h2>Response Time Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Average Response Time</h3>
            <p className="metric-value">
              {formatTime(analytics.responseTime.averageResponseTime)}
            </p>
          </div>
          <div className="metric-card">
            <h3>Average Resolution Time</h3>
            <p className="metric-value">
              {formatTime(analytics.responseTime.averageResolutionTime)}
            </p>
          </div>
          <div className="metric-card">
            <h3>Queries with Response</h3>
            <p className="metric-value">
              {analytics.responseTime.queriesWithResponse}
            </p>
          </div>
          <div className="metric-card">
            <h3>Queries Resolved</h3>
            <p className="metric-value">
              {analytics.responseTime.queriesWithResolution}
            </p>
          </div>
        </div>
      </div>

      {/* Query Types Distribution */}
      <div className="card">
        <h2>Query Types Distribution</h2>
        <div className="chart-container">
          <PieChart width={400} height={300}>
            <Pie
              data={prepareTagData()}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {prepareTagData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="card">
        <h2>Channel Distribution</h2>
        <div className="chart-container">
          <BarChart width={600} height={300} data={prepareChannelData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="card">
        <h2>Priority Distribution</h2>
        <div className="chart-container">
          <BarChart width={600} height={300} data={preparePriorityData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </div>
      </div>

      {/* Time-Based Analytics */}
      <div className="card">
        <h2>Queries Over Time (Last 7 Days)</h2>
        <div className="chart-container">
          <LineChart width={800} height={300} data={prepareTimeBasedData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
            <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
            <Line type="monotone" dataKey="escalated" stroke="#ff8042" name="Escalated" />
          </LineChart>
        </div>
      </div>

      {/* Team Performance */}
      {analytics.teamPerformance && analytics.teamPerformance.length > 0 && (
        <div className="card">
          <h2>Team Performance</h2>
          <div className="team-performance-table">
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Total Queries</th>
                  <th>Resolved</th>
                  <th>Avg Response Time</th>
                  <th>Avg Resolution Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.teamPerformance.map(team => (
                  <tr key={team.teamId}>
                    <td>{team.teamName}</td>
                    <td>{team.totalQueries}</td>
                    <td>{team.resolvedQueries}</td>
                    <td>{formatTime(team.averageResponseTime)}</td>
                    <td>{formatTime(team.averageResolutionTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

