import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './application.css';

const ApplicationManagement = () => {
  const [activeLink, setActiveLink] = useState('applications');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState({
    pending: [],
    inprogress: [],
    rejected: []
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // Fetch applications based on status
  const fetchApplications = async (status = 'pending') => {
    setLoading(true);
    setError(null);
    
    try {
      // 修改请求，为pending标签获取所有pending类型的应用
      let url = `http://localhost:3000/api/certificate-applications`;
      
      if (status === 'pending') {
        // 获取所有Pending状态的应用
        url += `?statusCategory=pending`;
      } else {
        // 其他标签页继续使用特定状态
        const statusValue = status === 'inprogress' ? 'In Progress' : 
                           status === 'rejected' ? 'Rejected' : status;
        url += `?status=${statusValue}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
    //   console.log(data);
      
      if (data.success) {
        // 更新特定状态类别的应用状态
        setApplications(prev => ({
          ...prev,
          [status.toLowerCase()]: data.applications
        }));
      } else {
        setError(data.message || 'Failed to fetch application data');
      }
    } catch (err) {
      console.error(`Error fetching ${status} applications:`, err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    // Start with pending applications
    fetchApplications('pending');
  }, []);

  // Tab change handler
  useEffect(() => {
    // 根据当前活动标签获取相应的数据
    fetchApplications(activeTab);
  }, [activeTab]);

  // Show success message for limited time
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter applications based on search term
  const filterApplications = (applications) => {
    if (!searchTerm) return applications;
    console.log(applications);
    return applications.filter(app => 
      app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Open application details modal
  const handleViewDetail = (application) => {
    setSelectedApplication(application);
    console.log(application);
    setShowDetailModal(true);
  };

  // Close detail modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedApplication(null);
  };

  // Handle application status change
  const handleStatusChange = async (applicationId, newStatus) => {
    setProcessingApplicationId(applicationId);
    
    try {
      const response = await fetch(`http://localhost:3000/api/certificate-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // If the action was successful, refresh the current tab
        const statusMap = {
          pending: 'Pending',
          inprogress: 'In Progress',
          rejected: 'Rejected'
        };
        
        fetchApplications(statusMap[activeTab]);
        
        // Show success message
        setActionSuccess({
          type: newStatus === 'In Progress' ? 'in-progress' : 'rejected',
          message: newStatus === 'In Progress'|| 'Certified' 
            ? 'Application successfully approved' 
            : 'Application has been rejected'
        });
        
        // Close modal if open
        if (showDetailModal) {
          handleCloseModal();
        }
      } else {
        // Show error in alert for now
        alert(data.message || 'Operation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Unable to update application status. Please check your network connection and try again.');
    } finally {
      setProcessingApplicationId(null);
    }
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!actionSuccess) return null;
    
    return (
      <div className={`success-message ${actionSuccess.type}`}>
        <i className="icon fa-solid fa-check-circle"></i>
        <span>{actionSuccess.message}</span>
      </div>
    );
  };
  console.log(applications);
  // Render application cards
  const renderApplicationCards = (applications) => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn-retry" onClick={() => {
            const statusMap = {
              pending: 'Pending',
              inprogress: 'In Progress',
              rejected: 'Rejected'
            };
            fetchApplications(statusMap[activeTab]);
          }}>
            Retry
          </button>
        </div>
      );
    }
    
    const filteredApplications = filterApplications(applications);
    
    if (filteredApplications.length === 0) {
      return (
        <div className="empty-state">
          <p>No application records at the moment</p>
        </div>
      );
    }

    return filteredApplications.map(app => (
      <div key={app.application_id} className="application-card">
        <div className="application-header">
          <div className="application-badge">
            <i className="icon fa-solid fa-file-certificate"></i>
          </div>
          <h3>{app.title}</h3>
          <div className={`status-badge ${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
            {app.status}
          </div>
        </div>
        
        <div className="application-details">
          <div className="application-applicant">
            <i className="icon fa-solid fa-user"></i>
            <span>Applicant: {app.username}</span>
          </div>
          
          <div className="application-type">
            <i className="icon fa-solid fa-tag"></i>
            <span>Certificate Type: {app.type}</span>
          </div>
          
          <div className="application-date">
            <i className="icon fa-solid fa-calendar-alt"></i>
            <span>Application Date: {app.appliedOn}</span>
          </div>
        </div>
        
        <div className="application-description">
          {app.description?.length > 120 
            ? `${app.description.substring(0, 120)}...` 
            : app.description}
        </div>
        
        <div className="application-actions">
          <button 
            className="btn-view-details"
            onClick={() => handleViewDetail(app)}
          >
            View Details
          </button>
          
          {/* 所有Pending开头的状态都显示批准/拒绝按钮 */}
          {app.status && app.status.startsWith('Pending') && (
            <div className="approval-actions">
              <button 
                className={`btn-approve ${processingApplicationId === app.application_id ? 'processing' : ''}`}
                onClick={() => handleStatusChange(app.application_id, app.status === 'Pending for Registration' ? 'In Progress' : 'Certified')}
                disabled={processingApplicationId !== null}
              >
                {processingApplicationId === app.application_id ? 'Processing...' : 'Approve'}
              </button>
              <button 
                className={`btn-reject ${processingApplicationId === app.application_id ? 'processing' : ''}`}
                onClick={() => handleStatusChange(app.application_id, 'Rejected')}
                disabled={processingApplicationId !== null}
              >
                {processingApplicationId === app.application_id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Render application detail modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedApplication) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content application-detail-modal">
          <div className="modal-header">
            <h2>Application Details</h2>
            <p>{selectedApplication.title}</p>
            <button className="modal-close" onClick={handleCloseModal}>
              <i className="icon fa-solid fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="detail-section">
              <h3>Application Information</h3>
              
              <div className="detail-item">
                <span className="detail-label">Application ID:</span>
                <span className="detail-value">{selectedApplication.application_id}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Applicant:</span>
                <span className="detail-value">{selectedApplication.username}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Application Date:</span>
                <span className="detail-value">{selectedApplication.appliedOn}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-${selectedApplication.status?.toLowerCase().replace(' ', '-')}`}>
                  {selectedApplication.status === 'Pending' ? 'Pending' : 
                   selectedApplication.status === 'In Progress' ? 'In Progress' : 
                   selectedApplication.status === 'Rejected' ? 'Rejected' : selectedApplication.status}
                </span>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Certificate Information</h3>
              
              <div className="detail-item">
                <span className="detail-label">Certificate Name:</span>
                <span className="detail-value">{selectedApplication.title}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Certificate Type:</span>
                <span className="detail-value">{selectedApplication.type}</span>
              </div>
              
              <div className="detail-item full-width">
                <span className="detail-label">Description:</span>
                <p className="detail-value description">{selectedApplication.description}</p>
              </div>
            </div>
            
            {/* 所有Pending开头的状态都显示审批操作部分 */}
            {selectedApplication.status && selectedApplication.status.startsWith('Pending') && (
              <div className="detail-section actions-section">
                <h3>Review Actions</h3>
                <p className="action-note">Please ensure the applicant meets all certificate requirements before reviewing</p>
                
                <div className="detail-actions">
                  <button 
                    className={`btn-approve ${processingApplicationId ? 'processing' : ''}`}
                    onClick={() => handleStatusChange(
                      selectedApplication.application_id, 
                      selectedApplication.status === 'Pending for Registration' ? 'In Progress' : 'Certified'
                    )}
                    disabled={processingApplicationId !== null}
                  >
                    {processingApplicationId ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button 
                    className={`btn-reject ${processingApplicationId ? 'processing' : ''}`}
                    onClick={() => handleStatusChange(selectedApplication.application_id, 'Rejected')}
                    disabled={processingApplicationId !== null}
                  >
                    {processingApplicationId ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button className="btn-close" onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <AdminSidebar activeLink={activeLink} />
      
      <div className="main-content">
        {/* Success message */}
        {renderSuccessMessage()}
        
        <div className="application-management-header">
          <div className="header-title">
            <h1>Certificate Application Management</h1>
            <p>View and manage certificate applications</p>
          </div>
          
          <div className="application-tabs">
            <button 
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <i className="icon fa-solid fa-clock"></i>
              Pending
            </button>
            <button 
              className={`tab-button ${activeTab === 'inprogress' ? 'active' : ''}`}
              onClick={() => setActiveTab('inprogress')}
            >
              <i className="icon fa-solid fa-check-circle"></i>
              In Progress
            </button>
            <button 
              className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <i className="icon fa-solid fa-times-circle"></i>
              Rejected
            </button>
          </div>
        </div>

        <div className="application-content">
          <div className="application-filters">
            <div className="search-container">
              <i className="icon fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="filter-actions">
              <button className="btn-filter">
                <i className="icon fa-solid fa-filter"></i>
                Filter
              </button>
              
              <button className="btn-export">
                <i className="icon fa-solid fa-file-export"></i>
                Export
              </button>
            </div>
          </div>

          <div className="application-statistics">
            <div className="stat-card">
              <div className="stat-icon pending">
                <i className="icon fa-solid fa-clock"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{applications.pending.length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon in-progress">
                <i className="icon fa-solid fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{applications.inprogress.length}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon rejected">
                <i className="icon fa-solid fa-times-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{applications.rejected.length}</span>
                <span className="stat-label">Rejected</span>
              </div>
            </div>
          </div>

          <div className="application-list">
            {renderApplicationCards(applications[activeTab] || [])}
          </div>
        </div>
      </div>
      
      {/* Render the detail modal */}
      {renderDetailModal()}
    </div>
  );
};

export default ApplicationManagement;
