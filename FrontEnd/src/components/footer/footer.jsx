import React from 'react';
import './footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-section">
        <h3>ParkGuide</h3>
        <p>Your trusted companion for exploring national parks with expert guides and comprehensive resources.</p>
        <a href="/signin">Sign In</a>
      </div>
      <div className="footer-section">
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/feedback">Feedback</a></li>
          <li><a href="/map">Interactive Map</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Resources</h3>
        <ul>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/certification">Certification</a></li>
          <li><a href="/directory">Park Directory</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Contact</h3>
        <p><i className="fas fa-map-marker-alt"></i> Sarawak Forestry Corporation, Malaysia</p>
        <p><i className="fas fa-envelope"></i> info@parkguide.com</p>
        <p><i className="fas fa-phone"></i> (60) 123-4567</p>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} ParkGuide. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 