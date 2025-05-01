import React, { useState, useEffect } from 'react';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import './dashboard.css';

const Dashboard = () => {
  const [activeLink, setActiveLink] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen width and set mobile device state
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add window resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <ParkGuideSidebar 
        activeLink={activeLink} 
        isOpen={!isMobile || sidebarOpen} 
        toggleSidebar={toggleSidebar}
      />
      
      <div className="main-content">
        <div className="header">
          {isMobile && (
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          )}
          <div className="header-title">
            <h1>Guide Dashboard</h1>
            <p>Welcome back, John! Here's an overview of your activities.</p>
          </div>
          <div className="header-actions">
            <button className="btn-schedule">
              <i className="fa-solid fa-calendar-days"></i>
              <span>View Schedule</span>
            </button>
            <button className="btn-tour">
              <i className="fa-solid fa-play"></i>
              <span>Start Tour</span>
            </button>
          </div>
        </div>
        
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Today's Tours</h3>
              <div className="stat-number">3</div>
              <div className="stat-detail">
                <i className="fa-solid fa-clock"></i>
                <span>Next tour in 45 minutes</span>
              </div>
            </div>
            <div className="stat-icon">
              <i className="fa-solid fa-play"></i>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Visitors Today</h3>
              <div className="stat-number">24</div>
              <div className="stat-detail">
                <i className="fa-solid fa-users"></i>
                <span>8 more than yesterday</span>
              </div>
            </div>
            <div className="stat-icon">
              <i className="fa-solid fa-users"></i>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Wildlife Sightings</h3>
              <div className="stat-number">12</div>
              <div className="stat-detail">
                <i className="fa-solid fa-tree"></i>
                <span>4 orangutans spotted today</span>
              </div>
            </div>
            <div className="stat-icon">
              <i className="fa-solid fa-tree"></i>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <h3>Unread Messages</h3>
              <div className="stat-number">5</div>
              <div className="stat-detail">
                <i className="fa-solid fa-envelope"></i>
                <span>2 new since yesterday</span>
              </div>
            </div>
            <div className="stat-icon">
              <i className="fa-solid fa-envelope"></i>
            </div>
          </div>
        </div>
        
        <div className="dashboard-layout">
          <div className="upcoming-tours">
            <div className="section-header">
              <h2>Upcoming Tours</h2>
              <p>Your scheduled tours for today</p>
            </div>
            
            <div className="tour-list">
              <div className="tour-item">
                <div className="tour-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="tour-info">
                  <h3>Morning Wildlife Walk</h3>
                  <div className="tour-details">
                    <div className="detail">
                      <i className="fa-solid fa-clock"></i>
                      <span>10:30 AM - 12:00 PM</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>Main Entrance</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-users"></i>
                      <span>8 visitors</span>
                    </div>
                  </div>
                </div>
                <div className="tour-status">
                  <span className="status-tag">Upcoming</span>
                </div>
              </div>
              
              <div className="tour-item">
                <div className="tour-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="tour-info">
                  <h3>Orangutan Feeding Session</h3>
                  <div className="tour-details">
                    <div className="detail">
                      <i className="fa-solid fa-clock"></i>
                      <span>2:30 PM - 3:30 PM</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>Feeding Platform 2</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-users"></i>
                      <span>12 visitors</span>
                    </div>
                  </div>
                </div>
                <div className="tour-status">
                  <span className="status-tag">Upcoming</span>
                </div>
              </div>
              
              <div className="tour-item">
                <div className="tour-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="tour-info">
                  <h3>Evening Nature Trail</h3>
                  <div className="tour-details">
                    <div className="detail">
                      <i className="fa-solid fa-clock"></i>
                      <span>5:00 PM - 6:30 PM</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>Eastern Trail</span>
                    </div>
                    <div className="detail">
                      <i className="fa-solid fa-users"></i>
                      <span>4 visitors</span>
                    </div>
                  </div>
                </div>
                <div className="tour-status">
                  <span className="status-tag">Upcoming</span>
                </div>
              </div>
              
              <div className="view-all">
                <button className="view-all-btn">View Full Schedule</button>
              </div>
            </div>
          </div>
          
          <div className="recent-sightings">
            <div className="section-header">
              <h2>Recent Wildlife Sightings</h2>
              <p>Reported in the last 24 hours</p>
            </div>
            
            <div className="sightings-list">
              <div className="sighting-item">
                <div className="sighting-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="sighting-info">
                  <div className="sighting-header">
                    <h3>Orangutan</h3>
                    <span className="sighting-time">9:15 AM</span>
                  </div>
                  <div className="sighting-location">Feeding Platform 1</div>
                  <div className="sighting-count">Count: 3</div>
                  <div className="sighting-reporter">Reported by: Sarah</div>
                </div>
              </div>
              
              <div className="sighting-item">
                <div className="sighting-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="sighting-info">
                  <div className="sighting-header">
                    <h3>Proboscis Monkey</h3>
                    <span className="sighting-time">11:30 AM</span>
                  </div>
                  <div className="sighting-location">Eastern Trail</div>
                  <div className="sighting-count">Count: 5</div>
                  <div className="sighting-reporter">Reported by: Michael</div>
                </div>
              </div>
              
              <div className="sighting-item">
                <div className="sighting-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="sighting-info">
                  <div className="sighting-header">
                    <h3>Hornbill</h3>
                    <span className="sighting-time">2:45 PM</span>
                  </div>
                  <div className="sighting-location">Canopy Walk</div>
                  <div className="sighting-count">Count: 2</div>
                  <div className="sighting-reporter">Reported by: You</div>
                </div>
              </div>
              
              <div className="sighting-item">
                <div className="sighting-icon">
                  <i className="fa-solid fa-tree"></i>
                </div>
                <div className="sighting-info">
                  <div className="sighting-header">
                    <h3>Orangutan</h3>
                    <span className="sighting-time">4:20 PM</span>
                  </div>
                  <div className="sighting-location">Feeding Platform 2</div>
                  <div className="sighting-count">Count: 1</div>
                  <div className="sighting-reporter">Reported by: You</div>
                </div>
              </div>
              
              <div className="add-sighting">
                <button className="add-sighting-btn">
                  <i className="fa-solid fa-plus"></i>
                  <span>Report New Sighting</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Backdrop, shown when the sidebar is open */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default Dashboard;
