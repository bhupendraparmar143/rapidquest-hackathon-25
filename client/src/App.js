/**
 * Main App Component
 * Sets up routing and application structure
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import UnifiedInbox from './pages/UnifiedInbox';
import Analytics from './pages/Analytics';
import QueryDetail from './pages/QueryDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<UnifiedInbox />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/query/:id" element={<QueryDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;


