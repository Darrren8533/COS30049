import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './dashboard.css';

const Dashboard = () => {
  const [activeLink, setActiveLink] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    user: {
      username: '',
      fullName: '',
      email: '',
      role: '',
      registeredSince: '',
      lastActive: '',
    },
    certifications: {
      total: 0,
      active: 0,
      inProgress: 0,
      pending: 0,
      recent: []
    },
    notifications: {
      unread: 0,
      recent: []
    },
    progress: {
      topicsDone: 0,
      totalTopics: 0,
      quizzesPassed: 0,
      totalQuizzes: 0,
      lastActivity: '',
    }
  });

  const navigate = useNavigate();
  
  // Get user ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch user profile information
        const userResponse = await fetch(`http://localhost:3000/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        
        // API adjustment: Since there is no /certificates/stats endpoint, we will use existing APIs to combine data
        
        // Fetch Certified certificates
        const certifiedResponse = await fetch(`http://localhost:3000/api/users/${userId}/certified-certificates`);
        const certifiedData = await certifiedResponse.json();
        
        // Fetch In Progress certificates
        const inProgressResponse = await fetch(`http://localhost:3000/api/users/${userId}/certificate-applications?status=In Progress`);
        const inProgressData = await inProgressResponse.json();
        
        // Fetch pending certificate applications
        const pendingResponse = await fetch(`http://localhost:3000/api/users/${userId}/certificate-applications?statusCategory=pending`);
        const pendingData = await pendingResponse.json();
        
        // Calculate certificate statistics
        const totalCertificates = (certifiedData.success ? certifiedData.certificates.length : 0) + 
                                 (inProgressData.success ? inProgressData.applications.length : 0);
        const activeCertificates = certifiedData.success ? certifiedData.certificates.length : 0;
        const inProgressCount = inProgressData.success ? inProgressData.applications.length : 0;
        const pendingCount = pendingData.success ? pendingData.applications.length : 0;
        
        // Extract details of in-progress certificates
        const recentCerts = inProgressData.success ? 
          inProgressData.applications.slice(0, 3).map(cert => ({
            id: cert.id,
            title: cert.title,
            progress: typeof cert.progress === 'number' ? cert.progress : 0,
            status: cert.status
          })) : [];
        
        // 获取通知数据
        const notificationsResponse = await fetch(`http://localhost:3000/api/notifications/${userId}`);
        const notificationsData = await notificationsResponse.json();
        
        // 计算未读通知数量
        const notificationsUnread = notificationsData.filter(
          notification => notification.to_user_id == userId && notification.type === 'unread'
        ).length;
        
        // 获取最近3条通知
        const recentNotifications = notificationsData
          .filter(notification => notification.to_user_id == userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .map(notification => ({
            id: notification.id,
            title: notification.title,
            date: notification.date || new Date(notification.created_at).toLocaleDateString(),
            read: notification.is_read || notification.type === 'read'
          }));
        
        // Calculate learning progress (derived from in-progress certificates)
        let topicsDone = 0;
        let totalTopics = 0;
        let quizzesPassed = 0;
        let totalQuizzes = 0;
        
        // If there are in-progress certificates, use the progress of the first certificate as part of the overall progress
        if (recentCerts.length > 0) {
          const firstCertProgress = recentCerts[0].progress;
          topicsDone = Math.round(firstCertProgress * 4 / 100); // Assume each certificate has 4 topics
          totalTopics = 4;
          quizzesPassed = Math.round(firstCertProgress * 4 / 100); // Assume each topic has one quiz
          totalQuizzes = 4;
        }
        
        // Update state
        setStats({
          user: {
            username: userData.user?.username || currentUser.username || 'User',
            fullName: userData.user?.fullName || 'Park Guide User',
            email: userData.user?.email || 'guide@example.com',
            role: userData.user?.role || currentUser.userRole || 'Guide',
            registeredSince: userData.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : 'Jan 1, 2023',
            lastActive: userData.user?.lastActive ? new Date(userData.user.lastActive).toLocaleDateString() : 'Today'
          },
          certifications: {
            total: totalCertificates,
            active: activeCertificates,
            inProgress: inProgressCount,
            pending: pendingCount,
            recent: recentCerts
          },
          notifications: {
            unread: notificationsUnread,
            recent: recentNotifications
          },
          progress: {
            topicsDone: topicsDone,
            totalTopics: totalTopics,
            quizzesPassed: quizzesPassed,
            totalQuizzes: totalQuizzes,
            lastActivity: new Date().toLocaleDateString()
          }
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Set default data to ensure the UI can display properly
        setStats(prev => ({
          ...prev,
          user: {
            ...prev.user,
            username: currentUser.username || 'User',
            role: currentUser.userRole || 'Guide'
          }
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [userId]); // Add userId as a dependency to ensure data is refetched when the user ID changes

  // Calculate overall certification progress percentage
  const calculateOverallProgress = () => {
    const { topicsDone, totalTopics, quizzesPassed, totalQuizzes } = stats.progress;
    
    if (totalTopics === 0 && totalQuizzes === 0) return 0;
    
    const topicsWeight = 0.6; // Topics are 60% of progress
    const quizzesWeight = 0.4; // Quizzes are 40% of progress
    
    const topicsProgress = totalTopics > 0 ? (topicsDone / totalTopics) * topicsWeight : 0;
    const quizzesProgress = totalQuizzes > 0 ? (quizzesPassed / totalQuizzes) * quizzesWeight : 0;
    
    return Math.round((topicsProgress + quizzesProgress) * 100);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Navigate to certifications page
  const goToCertifications = () => {
    navigate('/certifications');
  };

  // Navigate to notifications page
  const goToNotifications = () => {
    navigate('/notification');
  };

  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} />
      
      <div className="main-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            <div className="dashboard-header">
              <div className="welcome-section">
                <h1>Welcome back, {stats.user.username}</h1>
                <p>This is your guide certification progress overview</p>
              </div>
              
            </div>
            
            {/* Summary Stats Cards */}
            <div className="stats-overview">
              <div className="stats-card">
                <div className="stats-icon certifications">
                  <i className="icon fa-solid fa-certificate"></i>
                </div>
                <div className="stats-info">
                  <h3>Certifications</h3>
                  <div className="stats-number">{stats.certifications.total}</div>
                  <div className="stats-detail">
                    {/* <span>{stats.certifications.active} Active</span> •  */}
                    <span>{stats.certifications.inProgress} In Progress</span>
                  </div>
                </div>
              </div>
              
              {/* <div className="stats-card">
                <div className="stats-icon progress">
                  <i className="icon fa-solid fa-spinner"></i>
                </div>
                <div className="stats-info">
                  <h3>Overall Progress</h3>
                  <div className="stats-number">{calculateOverallProgress()}%</div>
                  <div className="stats-detail">
                    <span>{stats.progress.topicsDone}/{stats.progress.totalTopics} Topics</span> • 
                    <span>{stats.progress.quizzesPassed}/{stats.progress.totalQuizzes} Quizzes</span>
                  </div>
                </div>
              </div> */}
              
              <div className="stats-card">
                <div className="stats-icon notifications">
                  <i className="icon fa-solid fa-bell"></i>
                </div>
                <div className="stats-info">
                  <h3>Notifications</h3>
                  <div className="stats-number">{stats.notifications.unread}</div>
                  <div className="stats-detail">
                    <span>Unread Messages</span>
                    <button className="btn-view-all-small" onClick={goToNotifications}>
                      View All
                    </button>
                  </div>
              </div>
            </div>
          </div>
          
            {/* Main Dashboard Sections */}
            <div className="dashboard-sections">
              {/* In Progress Certifications */}
              <div className="dashboard-section certifications-progress">
            <div className="section-header">
                  <h2>In Progress Certifications</h2>
                  <button className="btn-view-all-small" onClick={goToCertifications}>
                    View All
                  </button>
                </div>
                
                <div className="section-content">
                  {stats.certifications.recent.length > 0 ? (
                    <div className="cert-progress-cards">
                      {stats.certifications.recent.map(cert => (
                        <div key={cert.id} className="cert-progress-card">
                          <div className="cert-header">
                            <div className="cert-icon">
                              <i className="icon fa-solid fa-certificate"></i>
                            </div>
                            <h3>{cert.title}</h3>
                          </div>
                          
                          <div className="cert-progress">
                            <div className="progress-label">
                              <span>Progress</span>
                              <span className="progress-percentage">{cert.progress}%</span>
                  </div>
                            <div className="progress-bar-container">
                              <div className="progress-bar" style={{ width: `${cert.progress}%` }}></div>
                </div>
              </div>
              
                          <div className="cert-actions">
                            <Link to={`/parkguide/progress-details/${cert.id}`} className="btn-continue">
                              Continue Learning
                            </Link>
                          </div>
                        </div>
                      ))}
                </div>
                  ) : (
                    <div className="empty-state">
                      <p>You have no certifications in progress.</p>
                      <button className="btn-browse" onClick={goToCertifications}>
                        Browse Available Certifications
                      </button>
                  </div>
                  )}
                </div>
              </div>
              
              {/* Recent Notifications */}
              <div className="dashboard-section recent-notifications">
                <div className="section-header">
                  <h2>Recent Notifications</h2>
                  <button className="btn-view-all-small" onClick={goToNotifications}>
                    View All
                  </button>
                </div>
                
                <div className="section-content">
                  {stats.notifications.recent.length > 0 ? (
                    <div className="notifications-list">
                      {stats.notifications.recent.map(notif => (
                        <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                          <div className="notification-icon">
                            <i className="icon fa-solid fa-bell"></i>
                          </div>
                          <div className="notification-content">
                            <h3>{notif.title}</h3>
                            <p className="notification-date">{formatDate(notif.date)}</p>
                          </div>
                          {!notif.read && (
                            <div className="notification-badge">
                              <span>New</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>You have no recent notifications.</p>
                  </div>
                  )}
                </div>
              </div>
              
              {/* Quick Links & Resources */}
              <div className="dashboard-section quick-links">
                <div className="section-header">
                  <h2>Quick Links</h2>
                </div>
                
                <div className="section-content">
                  <div className="quick-links-grid">
                    <Link to="/parkguide/certifications" className="quick-link-card">
                      <div className="quick-link-icon">
                        <i className="icon fa-solid fa-certificate"></i>
                      </div>
                      <h3>Certifications</h3>
                      <p>Browse and apply for new certifications</p>
                    </Link>
                    
                    <Link to="/parkguide/profile" className="quick-link-card">
                      <div className="quick-link-icon">
                        <i className="icon fa-solid fa-user"></i>
                      </div>
                      <h3>Profile</h3>
                      <p>Update your personal information</p>
                    </Link>
                    
                    <Link to="/parkguide/notifications" className="quick-link-card">
                      <div className="quick-link-icon">
                        <i className="icon fa-solid fa-bell"></i>
                      </div>
                      <h3>Notifications</h3>
                      <p>View updates and messages</p>
                    </Link>
                    
                    <Link to="/parkguide/identification" className="quick-link-card">
                      <div className="quick-link-icon">
                        <i className="icon fa-solid fa-camera"></i>
                      </div>
                      <h3>Species Identification</h3>
                      <p>Identify species and landmarks</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
