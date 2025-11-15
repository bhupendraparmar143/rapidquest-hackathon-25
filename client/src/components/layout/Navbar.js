/**
 * Navigation Bar Component
 * Provides navigation links to different sections of the application
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          📧 Query Management
        </Link>
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/inbox" className={`nav-link ${isActive('/inbox')}`}>
              Unified Inbox
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/analytics" className={`nav-link ${isActive('/analytics')}`}>
              Analytics
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

