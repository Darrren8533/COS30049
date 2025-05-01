import React, { useState, useEffect } from 'react';
import './navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in by getting data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    setUser(null);
    
    // Redirect to homepage or signin page
    window.location.href = '/';
  };
  
  return (
    <nav className="navbar">
      <div className="logo">
        <a href="/"><i className="fas fa-leaf"></i> ParkGuide</a>
      </div>
      <div className="nav-links">
        <a href="/about">About</a>
        <a href="/features">Features</a>
        <a href="/testimonials">Testimonials</a>
        <a href="/contact">Contact</a>
      </div>
      <div className="auth-buttons">
        {user ? (
          // Show logout button if user is logged in
          <>
            <span className="user-welcome">Welcome, {user.username}</span>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </>
        ) : (
          // Show signup and signin buttons if user is not logged in
          <>
            <a href="/signup" className="btn btn-light">Sign Up</a>
            <a href="/signin" className="btn btn-outline">Sign In</a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 