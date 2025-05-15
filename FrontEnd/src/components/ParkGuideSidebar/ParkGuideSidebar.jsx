import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ParkGuideSidebar.css';

const ParkGuideSidebar = ({ activeLink, isOpen, toggleSidebar }) => {
  const [user, setUser] = useState({ username: 'User', role: 'Guide' });
  
  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        username: parsedUser.username || 'User',
        role: parsedUser.userRole || 'Guide'
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="close-sidebar" onClick={toggleSidebar}>
        <i className="fa-solid fa-times"></i>
      </div>
      
      <div className="profile">
        <div className="avatar"></div>
        <div className="profile-info">
          <h3>{user.username}</h3>
          <span>{user.role}</span>
        </div>
      </div>
      
      <div className="sidebar-section">
        <ul className="sidebar-menu">
          <li className={activeLink === 'dashboard' ? 'active' : ''}>
            <Link to="/parkguide/dashboard" className="menu-item">
            <i className="icon fa-solid fa-house"></i>
            <span>Dashboard</span>
            </Link>
          </li>
          <li className={activeLink === 'certifications' ? 'active' : ''}>
            <Link to="/parkguide/certifications" className="menu-item">
            <i className="icon fa-solid fa-certificate"></i>
            <span>Certifications</span>
            </Link>
          </li>
          <li className={activeLink === 'notifications' ? 'active' : ''}>
            <Link to="/parkguide/notifications" className="menu-item">
            <i className="icon fa-solid fa-bell"></i>
              <span>Notifications</span>
            </Link>
          </li>
          <li className={activeLink === 'identification' ? 'active' : ''}>
            <Link to="/parkguide/identification" className="menu-item">
            <i className="icon fa-solid fa-camera"></i>
              <span>Identification</span>
            </Link>
          </li>
          <li className={activeLink === 'profile' ? 'active' : ''}>
            <Link to="/parkguide/profile" className="menu-item">
            <i className="icon fa-solid fa-user"></i>
              <span>My Profile</span>
            </Link>
          </li>
          {/* <li className={activeLink === 'settings' ? 'active' : ''}>
            <Link to="/parkguide/settings" className="menu-item">
            <i class="icon fa-solid fa-gear"></i>
              <span>Settings</span>
            </Link>
          </li> */}
        </ul>
      </div>
      
      <div className="logout-container">
        <Link onClick={handleLogout} className="logout-button">
          <i className="icon fa-solid fa-sign-out-alt"></i>
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default ParkGuideSidebar;