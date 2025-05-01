import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './certificate.css';

const Certificate = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const [activeTab, setActiveTab] = useState('owned');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [availableCertificates, setAvailableCertificates] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [inProgressCertificates, setInProgressCertificates] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [confirmPrerequisites, setConfirmPrerequisites] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  
  // 使用导航hook
  const navigate = useNavigate();
  
  // Mock user ID - in a real application, this would come from authentication context
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;
  
  // Sample certification data for owned tab
  const sampleCertifications = {
    owned: []
  };
  
  // Fetch certified certificates from API
  const fetchCertifiedCertificates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}/certified-certificates`);
      const data = await response.json();
      
      if (data.success) {
        setCertificates(prev => ({
          ...prev,
          owned: data.certificates
        }));
      } else {
        setError(data.message || 'Failed to get certified certificates');
      }
    } catch (err) {
      console.error('Error fetching certified certificates:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available certificates from API
  const fetchAvailableCertificates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/certificates/available');
      const data = await response.json();
      
      if (data.success) {
        setAvailableCertificates(data.certificates);
      } else {
        setError(data.message || 'Failed to get certificates');
      }
    } catch (err) {
      console.error('Error fetching available certificates:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending applications from API
  const fetchPendingApplications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}/certificate-applications?statusCategory=pending`);
      const data = await response.json();
      
      if (data.success) {
        setPendingApplications(data.applications);
      } else {
        setError(data.message || 'Failed to get applications');
      }
    } catch (err) {
      console.error('Error fetching pending applications:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch in progress certificates from API
  const fetchInProgressCertificates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}/certificate-applications?status=In Progress`);
      const data = await response.json();
      
      if (data.success) {
        // Process the data to match our expected format
        const formattedCertificates = data.applications.map(app => ({
          id: app.id,
          title: app.title,
          type: app.type,
          description: app.description,
          status: app.status,
          progress: app.progress || '0%', // Default progress if not available
          topicsCompleted: app.topicsCompleted || '1 of 4 topics completed', // Default value if not available
          nextTopic: app.nextTopic || 'Wilderness Navigation', // Default value if not available
          approvedOn: app.approvedOn
        }));
        console.log('Formatted Certificates:', formattedCertificates);
        
        setInProgressCertificates(formattedCertificates);
      } else {
        setError(data.message || 'Failed to get in progress certificates');
      }
    } catch (err) {
      console.error('Error fetching in progress certificates:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data for owned certificates
    setCertificates(sampleCertifications);
    
    // Load data based on current tab
    if (activeTab === 'owned') {
      fetchCertifiedCertificates();
    } else if (activeTab === 'available') {
      fetchAvailableCertificates();
    } else if (activeTab === 'pendingApplications') {
      fetchPendingApplications();
    } else if (activeTab === 'inProgress') {
      fetchInProgressCertificates();
    } else {
      setLoading(false);
    }
  }, []);

  // When active tab changes
  useEffect(() => {
    if (activeTab === 'owned') {
      fetchCertifiedCertificates();
    } else if (activeTab === 'available') {
      fetchAvailableCertificates();
    } else if (activeTab === 'pendingApplications') {
      fetchPendingApplications();
    } else if (activeTab === 'inProgress') {
      fetchInProgressCertificates();
    }
  }, [activeTab]);

  // Show success message when application is submitted
  useEffect(() => {
    if (applicationSuccess) {
      const timer = setTimeout(() => {
        setApplicationSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [applicationSuccess]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter certifications based on search term
  const filterCertifications = (certifications) => {
    if (!searchTerm) return certifications;
    return certifications.filter(cert => 
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle apply button click
  const handleApply = (certificate) => {
    setSelectedCertificate(certificate);
    setShowApplyModal(true);
    setConfirmPrerequisites(false);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowApplyModal(false);
    setSelectedCertificate(null);
    setConfirmPrerequisites(false);
  };

  // Handle application submission
  const handleSubmitApplication = async () => {
    if (!confirmPrerequisites || !selectedCertificate) {
      return; // Don't submit if the checkbox isn't checked or no certificate selected
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/certificate-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          certificateId: selectedCertificate.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close the modal
        setShowApplyModal(false);
        
        // Show success message
        setApplicationSuccess(true);
        
        // Refresh pending applications list
        fetchPendingApplications();
        
        // Switch to pending applications tab
        setActiveTab('pendingApplications');
      } else {
        // Show error message
        alert(data.message || 'Application submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Application submission failed. Please check your network connection and try again.');
    }
  };

  // 处理Continue按钮点击，导航到进度详情页面
  const handleContinue = (certificateId) => {
    navigate(`/parkguide/progress-details/${certificateId}`);
  };

  // 处理完成证书的认证申请
  const handleApplyForCertified = async (certificate) => {
    try {
      const response = await fetch('http://localhost:3000/api/certificate-applications/certified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          certificateId: certificate.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 显示成功消息
        alert('Certification application submitted successfully! Your certificate will be reviewed.');
        
        // 刷新证书列表
        fetchInProgressCertificates();
      } else {
        // 显示错误消息
        alert(data.message || 'Certification application failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting certification application:', error);
      alert('Certification application failed. Please check your network connection and try again.');
    }
  };

  // Render certification cards
  const renderCertificationCards = (certifications) => {
    if (!certifications || certifications.length === 0) {
      return (
        <div className="empty-state">
          <p>No certifications found in this category.</p>
        </div>
      );
    }

    return filterCertifications(certifications).map(cert => (
      <div key={cert.id} className="certification-card">
        <div className="certification-header">
          <div className="certification-badge">
            <i className="icon fa-solid fa-certificate"></i>
          </div>
          <h3>{cert.title}</h3>
          <div className={`status-badge ${cert.status?.toLowerCase()}`}>
            {cert.status || 'Pending Approval'}
          </div>
        </div>
        
        <div className="certification-type">{cert.type}</div>
        
        <div className="certification-description">
          {cert.description}
        </div>
        
        {cert.validUntil && (
          <div className="certification-validity">
            <i className="icon fa-solid fa-check"></i>
            <span>Valid until {cert.validUntil}</span>
          </div>
        )}
        
        {cert.expiredOn && (
          <div className="certification-validity expired">
            <i className="icon fa-solid fa-xmark"></i>
            <span>Expired on {cert.expiredOn}</span>
          </div>
        )}
        
        {cert.issuedOn && (
          <div className="certification-issued">
            <i className="icon fa-solid fa-calendar-days"></i>
            <span>Issued on {cert.issuedOn}</span>
          </div>
        )}
        
        {cert.appliedOn && (
          <div className="certification-applied">
            <i className="icon fa-solid fa-calendar-days"></i>
            <span>Applied on {cert.appliedOn}</span>
          </div>
        )}
        
        {cert.approvedOn && (
          <div className="certification-approved">
            <i className="icon fa-solid fa-check-circle"></i>
            <span>Approved on {cert.approvedOn}</span>
          </div>
        )}
        
        {cert.estimatedReviewTime && (
          <div className="certification-review-time">
            <i className="icon fa-solid fa-clock"></i>
            <span>Estimated review time: {cert.estimatedReviewTime}</span>
          </div>
        )}
        
        {cert.progress && (
          <div className="certification-progress">
            <div className="progress-label">
              <i className="icon fa-solid fa-spinner"></i>
              <span>Progress</span>
              <span className="progress-percentage">{cert.progress}</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${cert.progress}%` }}></div>
            </div>
            <div className="progress-details">
              <span>{cert.topicsCompleted}</span>
            </div>
            {cert.nextTopic && (
              <div className="next-topic">
                <i className="icon fa-solid fa-arrow-right"></i>
                <span>Next: {cert.nextTopic}</span>
              </div>
            )}
          </div>
        )}
        
        {cert.duration && (
          <div className="certification-duration">
            <i className="icon fa-solid fa-hourglass-half"></i>
            <span>Duration: {cert.duration}</span>
          </div>
        )}
        
        {cert.difficulty && (
          <div className="certification-difficulty">
            <i className="icon fa-solid fa-gauge-high"></i>
            <span>Difficulty: {cert.difficulty}</span>
          </div>
        )}
        
        {cert.topicsCount && (
          <div className="certification-topics-count">
            <i className="icon fa-solid fa-list-check"></i>
            <span>{cert.topicsCount}</span>
          </div>
        )}
        
        <div className="certification-actions">
          {(cert.status === 'In Progress') && (
            <>
              <button className="btn-view-details" onClick={() => handleContinue(cert.id)}>Continue</button>
              {cert.progress === 100 && (
                <button className="btn-apply-certificate" onClick={() => handleApplyForCertified(cert)}>
                  <i className="icon fa-solid fa-check-circle"></i>
                  Apply for Certified
                </button>
              )}
            </>
          )}
          {(cert.status === 'Available') && (
            <>
              <button className="btn-view-details">Learn More</button>
              <button className="btn-apply-certificate" onClick={() => handleApply(cert)}>
                <i className="icon fa-solid fa-plus"></i>
                Apply
              </button>
            </>
          )}
          {(cert.status !== 'Available' && cert.status !== 'In Progress' && cert.status !== 'Active') && (
            <button className="btn-view-details">View Details</button>
          )}
          {(cert.status === 'Active') && (
            <button className="btn-view-details">View Certificate</button>
          )}
          {(cert.status === 'Available' || cert.status === 'In Progress' || cert.status === 'Active') ? null : (
            <button className="btn-more-options">
              <i className="icon fa-solid fa-ellipsis"></i>
            </button>
          )}
        </div>
      </div>
    ));
  };

  // Render application modal
  const renderApplyModal = () => {
    if (!showApplyModal || !selectedCertificate) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Apply for Certification</h2>
            <p>Complete the application form for {selectedCertificate.title}</p>
            <button className="modal-close" onClick={handleCloseModal}>
              <i className="icon fa-solid fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="certification-overview-section">
              <h3>Certification Overview</h3>
              <p>{selectedCertificate.description}</p>
              
              <h3>Prerequisites</h3>
              <ul className="prerequisites-list">
                <li className="prerequisite-item">
                  <i className="icon fa-solid fa-check"></i>
                  <span>Minimum 2 years of experience as a park guide</span>
                </li>
                <li className="prerequisite-item">
                  <i className="icon fa-solid fa-check"></i>
                  <span>First Aid and CPR certification</span>
                </li>
                <li className="prerequisite-item">
                  <i className="icon fa-solid fa-check"></i>
                  <span>Physical fitness assessment</span>
                </li>
              </ul>
              
              <h3>Topics Covered</h3>
              <ul className="topics-list">
                <li className="topic-item">
                  <span className="topic-number">1</span>
                  <span>Wilderness Navigation</span>
                </li>
                <li className="topic-item">
                  <span className="topic-number">2</span>
                  <span>Emergency Response Protocols</span>
                </li>
                <li className="topic-item">
                  <span className="topic-number">3</span>
                  <span>Technical Rescue Techniques</span>
                </li>
                <li className="topic-item">
                  <span className="topic-number">4</span>
                  <span>Search Patterns and Strategy</span>
                </li>
              </ul>
            </div>
            
            <div className="application-process-section">
              <div className="process-header">
                <i className="icon fa-solid fa-info-circle"></i>
                <h3>Application Process</h3>
              </div>
              <p>
                After submitting your application, it will be reviewed by an administrator. 
                You will be notified once your application is approved or if additional information is required.
              </p>
            </div>
            
            <div className="confirm-section">
              <label className="confirm-checkbox">
                <input 
                  type="checkbox" 
                  checked={confirmPrerequisites}
                  onChange={(e) => setConfirmPrerequisites(e.target.checked)}
                />
                <span>I confirm that I meet all prerequisites and commit to completing the certification requirements within the specified timeframe.</span>
              </label>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
            <button 
              className={`btn-submit ${!confirmPrerequisites ? 'disabled' : ''}`} 
              onClick={handleSubmitApplication}
              disabled={!confirmPrerequisites}
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!applicationSuccess) return null;
    
    return (
      <div className="success-message">
        <i className="icon fa-solid fa-check-circle"></i>
        <span>Application submitted successfully! You can track it in Pending Applications.</span>
      </div>
    );
  };

  // Render content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading certifications...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn-retry" onClick={() => {
            if (activeTab === 'available') {
              fetchAvailableCertificates();
            } else if (activeTab === 'pendingApplications') {
              fetchPendingApplications();
            } else if (activeTab === 'inProgress') {
              fetchInProgressCertificates();
            }
          }}>
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'owned':
        return renderCertificationCards(certificates.owned);
      case 'inProgress':
        return renderCertificationCards(inProgressCertificates);
      case 'available':
        return renderCertificationCards(availableCertificates);
      case 'pendingApplications':
        return renderCertificationCards(pendingApplications);
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} />
      
      <div className="main-content">
        {/* Success message */}
        {renderSuccessMessage()}
        
        <div className="certificate-tabs">
          <button 
            className={`tab-button ${activeTab === 'owned' || activeTab === 'inProgress' || activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('owned')}
          >
            <i className="icon fa-solid fa-certificate"></i>
            Certifications
          </button>
          <button 
            className={`tab-button ${activeTab === 'pendingApplications' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendingApplications')}
          >
            <i className="icon fa-solid fa-clock-rotate-left"></i>
            Pending Applications
          </button>
        </div>

        <div className="certificate-content">
          <div className="certificate-header">
            <div className="certificate-title">
              {activeTab === 'owned' && (
                <>
                  <h1>My Certifications</h1>
                  <p>Manage and track your certification progress</p>
                </>
              )}
              
              {activeTab === 'inProgress' && (
                <>
                  <h1>In Progress</h1>
                  <p>Certifications you are currently working on</p>
                </>
              )}
              
              {activeTab === 'available' && (
                <>
                  <h1>Available Certifications</h1>
                  <p>Explore certifications you can apply for</p>
                </>
              )}
              
              {activeTab === 'pendingApplications' && (
                <>
                  <h1>Pending Applications</h1>
                  <p>Track the status of your certification applications</p>
                </>
              )}
            </div>
            
            <div className="certificate-actions">
              {(activeTab === 'owned' || activeTab === 'inProgress' || activeTab === 'available') && (
                <>
                  <button className="btn-view-calendar">
                    <i className="icon fa-solid fa-calendar-days"></i>
                    View Calendar
                  </button>
                  <button className="btn-apply" onClick={() => handleApply({ 
                    id: 'CERT-1001',
                    title: 'Search and Rescue Operations',
                    description: 'Specialized training for park personnel involved in search and rescue operations in wilderness areas.'
                  })}>
                    <i className="icon fa-solid fa-plus"></i>
                    Apply for Certification
                  </button>
                </>
              )}
              
              {activeTab === 'pendingApplications' && (
                <button 
                  className="btn-back-to-certifications"
                  onClick={() => setActiveTab('available')}
                >
                  <i className="icon fa-solid fa-arrow-left"></i>
                  Back to Certifications
                </button>
              )}
            </div>
          </div>

          <div className="certificate-management">
            <h2>Certification Management</h2>
            <p>View and manage your certifications and progress</p>
            
            <div className="certificate-filters">
              <div className="search-container">
                <i className="icon fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder={activeTab === 'pendingApplications' ? "Search applications..." : "Search certifications..."}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              <button className="btn-filter">
                <i className="icon fa-solid fa-filter"></i>
                Filter
              </button>
              
              <button className="btn-export">
                <i className="icon fa-solid fa-file-export"></i>
                Export
              </button>
            </div>

            {(activeTab === 'owned' || activeTab === 'inProgress' || activeTab === 'available') && (
              <div className="certificate-tabs-status">
                <button 
                  className={`tab-button ${activeTab === 'owned' ? 'active' : ''}`}
                  onClick={() => setActiveTab('owned')}
                >
                  Owned
                </button>
                <button 
                  className={`tab-button ${activeTab === 'inProgress' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inProgress')}
                >
                  In Progress
                </button>
                <button 
                  className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
                  onClick={() => setActiveTab('available')}
                >
                  Available
                </button>
              </div>
            )}

            <div className="certificate-list">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the apply modal */}
      {renderApplyModal()}
    </div>
  );
};

export default Certificate;
