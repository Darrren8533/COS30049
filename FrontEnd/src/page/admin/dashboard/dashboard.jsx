//admin dashboard with admin sidebar 

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './dashboard.css';

const Dashboard = () => {
  const [activeLink, setActiveLink] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      admin: 0,
      guide: 0,
      visitor: 0,
      recentUsers: []
    },
    certificates: {
      total: 0,
      categories: []
    },
    applications: {
      pending: 0,
      inprogress: 0,
      rejected: 0,
      recentApplications: []
    },
    notifications: {
      unread: 0
    }
  });

  // API Base URL
  const API_BASE_URL = 'http://localhost:3000';

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users stats
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const usersData = await usersResponse.json();
      
      // Calculate user stats
      const adminUsers = usersData.filter(user => user.role === 'admin').length;
      const guideUsers = usersData.filter(user => user.role === 'guide').length;
      const visitorUsers = usersData.filter(user => user.role === 'visitor').length;
      
      // Get recent users (last 5)
      const recentUsers = usersData
        .sort((a, b) => new Date(b.registeredDate) - new Date(a.registeredDate))
        .slice(0, 5);
      
      // Fetch certificates
      const certificatesResponse = await fetch(`${API_BASE_URL}/api/certificates`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      let certificatesData = { certificates: [] };
      if (certificatesResponse.ok) {
        certificatesData = await certificatesResponse.json();
      }
      
      // Calculate certificate categories
      const certificateCategories = [];
      const categoryMap = new Map();
      
      certificatesData.certificates.forEach(cert => {
        if (categoryMap.has(cert.category)) {
          categoryMap.set(cert.category, categoryMap.get(cert.category) + 1);
        } else {
          categoryMap.set(cert.category, 1);
        }
      });
      
      categoryMap.forEach((count, category) => {
        certificateCategories.push({ name: category, count });
      });
      
      // Fetch applications
      const applicationsResponse = await fetch(`${API_BASE_URL}/api/certificate-applications`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Initialize applications data object
      let applicationsData = { applications: [] };
      
      if (applicationsResponse.ok) {
        // Parse API response
        applicationsData = await applicationsResponse.json();
      }
      
      // Ensure applications is an array
      const applications = Array.isArray(applicationsData.applications) 
        ? applicationsData.applications 
        : [];
      
      // Calculate application statistics
      const pendingApplications = applications.filter(app => app.status.startsWith('Pending')).length;
      const inProgressApplications = applications.filter(app => app.status === 'In Progress').length;
      const rejectedApplications = applications.filter(app => app.status === 'Rejected').length;
      
      // Get recent applications (latest 5)
      const recentApplications = [...applications]
        .sort((a, b) => new Date(b.application_date) - new Date(a.application_date))
        .slice(0, 5);
      
      // Update stats
      setStats({
        users: {
          total: usersData.length,
          admin: adminUsers,
          guide: guideUsers,
          visitor: visitorUsers,
          recentUsers
        },
        certificates: {
          total: certificatesData.certificates.length,
          categories: certificateCategories
        },
        applications: {
          pending: pendingApplications,
          inprogress: inProgressApplications,
          rejected: rejectedApplications,
          recentApplications
        },
        notifications: {
          unread: 0 // Placeholder for future implementation
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(`Failed to load dashboard statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Poll for updates every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      <div className="main-content">
        <div className="page-header">
          <div className="header-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome back! Here's an overview of your park management system.</p>
          </div>
          <button 
            className="refresh-button"
            onClick={fetchDashboardStats}
          >
            <i className="fas fa-sync-alt"></i> Refresh Data
          </button>
        </div>
        
        {error && (
          <div className="error-alert">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats Cards */}
            <div className="stats-overview">
              <div className="stats-card">
                <div className="stats-icon users">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stats-info">
                  <h3>Total Users</h3>
                  <div className="stats-number">{stats.users.total}</div>
                  <div className="stats-detail">
                    <span>{stats.users.admin} Admins</span> • 
                    <span>{stats.users.guide} Guides</span> • 
                    <span>{stats.users.visitor} Visitors</span>
                  </div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-icon certificates">
                  <i className="fas fa-certificate"></i>
                </div>
                <div className="stats-info">
                  <h3>Certificates</h3>
                  <div className="stats-number">{stats.certificates.total}</div>
                  <div className="stats-detail">
                    {stats.certificates.categories.slice(0, 2).map((cat, idx) => (
                      <span key={idx}>{cat.count} {cat.name}</span>
                    ))}
                    {stats.certificates.categories.length > 2 && " • ...more"}
                  </div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-icon applications">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stats-info">
                  <h3>Applications</h3>
                  <div className="stats-number">
                    {stats.applications.pending + stats.applications.inprogress + stats.applications.rejected}
                  </div>
                  <div className="stats-detail">
                    <span>{stats.applications.pending} Pending</span> • 
                    <span>{stats.applications.inprogress} In Progress</span> • 
                    <span>{stats.applications.rejected} Rejected</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Application Status */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Application Status</h2>
                <Link to="/admin/application" className="view-all-link">
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              
              <div className="application-status">
                <div className="status-item">
                  <div className="status-icon pending">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="status-info">
                    <div className="status-label">Pending</div>
                    <div className="status-value">{stats.applications.pending}</div>
                  </div>
                </div>
                
                <div className="status-item">
                  <div className="status-icon inprogress">
                    <i className="fas fa-spinner"></i>
                  </div>
                  <div className="status-info">
                    <div className="status-label">In Progress</div>
                    <div className="status-value">{stats.applications.inprogress}</div>
                  </div>
                </div>
                
                <div className="status-item">
                  <div className="status-icon rejected">
                    <i className="fas fa-times-circle"></i>
                  </div>
                  <div className="status-info">
                    <div className="status-label">Rejected</div>
                    <div className="status-value">{stats.applications.rejected}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Users */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Recent Users</h2>
                <Link to="/admin/users" className="view-all-link">
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              
              <div className="recent-users-table">
                <div className="table-header">
                  <div className="th">User</div>
                  <div className="th">Email</div>
                  <div className="th">Role</div>
                  <div className="th">Registered Date</div>
                </div>
                
                {stats.users.recentUsers.length > 0 ? (
                  stats.users.recentUsers.map((user, idx) => (
                    <div className="table-row" key={idx}>
                      <div className="td user-cell">
                        <div className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-name">{user.name}</div>
                      </div>
                      <div className="td">{user.email}</div>
                      <div className="td">
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </div>
                      <div className="td">{user.registeredDate}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-items-message">
                    No users found.
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Applications */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Recent Applications</h2>
                <Link to="/admin/application" className="view-all-link">
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
              
              <div className="recent-applications">
                {stats.applications.recentApplications.length > 0 ? (
                  stats.applications.recentApplications.map((app, idx) => (
                    <div className="application-item" key={idx}>
                      <div className="app-status">
                        <span className={`status-badge ${app.status.replace(/\s+/g, '').toLowerCase()}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="app-details">
                        <h3>{app.title}</h3>
                        <div className="app-meta">
                          <span>
                            <i className="fas fa-user"></i> {app.username}
                          </span>
                          <span>
                            <i className="fas fa-calendar"></i> {new Date(app.application_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="app-actions">
                        <Link to={`/admin/application?id=${app.application_id}`} className="view-details-btn">
                          <i className="fas fa-eye"></i>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-items-message">
                    No recent applications found.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;