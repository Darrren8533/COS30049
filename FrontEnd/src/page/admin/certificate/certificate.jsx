import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './certificate.css';

const Certificate = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLink, setActiveLink] = useState('certifications');
  const navigate = useNavigate();
  
  // State for certificates
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for active menu
  const [activeMenu, setActiveMenu] = useState(null);
  
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch certificates from API
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/certificates');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch certificates');
      }
      
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError(error.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCertificates();
  }, []);

  // Filter certifications based on search term
  const filteredCertifications = certificates.filter(cert => 
    cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Toggle menu visibility
  const toggleMenu = (e, certId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === certId ? null : certId);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Handle edit certificate
  const handleEdit = (e, certId) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to edit page
    navigate(`/admin/certificate/edit/${certId}`);
    setActiveMenu(null);
  };
  
  // Open delete confirmation
  const handleDeleteClick = (e, certId, certTitle) => {
    e.preventDefault();
    e.stopPropagation();
    setCertificateToDelete({ id: certId, title: certTitle });
    setShowDeleteConfirm(true);
    setActiveMenu(null);
  };
  
  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setCertificateToDelete(null);
  };
  
  // Handle delete certificate
  const handleDeleteConfirm = async () => {
    if (!certificateToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`http://localhost:3000/api/deleteCertificates/${certificateToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete certificate');
      }
      
      // Refresh certificates list
      fetchCertificates();
      
      // Close confirmation dialog
      closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      // You can add error handling UI here if needed
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle create certificate button click
  const handleCreateCertificate = () => {
    navigate('/admin/certificate/create');
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Component */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div>
            <h1>Certifications</h1>
            <p>Manage all park guide certifications</p>
          </div>
          <div className="user-profile">
            <div className="notifications">
              <i className="far fa-bell"></i>
              <span className="notification-badge">3</span>
            </div>
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&auto=format&fit=crop" alt="Admin" className="user-avatar" />
          </div>
        </div>
        
        <div className="certification-container">
          <div className="cert-header">
            <h2>Certificate Management</h2>
            <p>View, create, edit, and delete certification programs for park guides.</p>
          </div>
          
          <div className="cert-actions">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search certificates..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="action-buttons">
              <button className="btn-export">
                <i className="fas fa-download"></i> Export
              </button>
              <Link to="/admin/certificate/create" className="btn-create">
                <i className="fas fa-plus"></i> Create Certificate
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading certificates...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                className="btn-retry" 
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : filteredCertifications.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-certificate empty-icon"></i>
              <h3>No Certificates Found</h3>
              <p>
                {searchTerm 
                  ? "No certificates match your search criteria." 
                  : "You haven't created any certificates yet."}
              </p>
              <Link to="/admin/certificate/create" className="btn-create-first">
                Create Your First Certificate
              </Link>
            </div>
          ) : (
            <div className="cert-grid">
              {filteredCertifications.map(cert => (
                <Link to={`/admin/certificate/${cert.id}`} key={cert.id} style={{ textDecoration: 'none' }}>
                  <div className="cert-card">
                    <div className="cert-card-header">
                      <i className="fas fa-graduation-cap cert-icon"></i>
                      <span className={`cert-status ${cert.status.toLowerCase()}`}>
                        {cert.status}
                      </span>
                    </div>
                    <div className="cert-card-body">
                      <h3 className="cert-title">{cert.title}</h3>
                      <p className="cert-category">{cert.category}</p>
                      <p className="cert-description">{cert.description}</p>
                    </div>
                    <div className="cert-card-footer">
                      <span className="cert-id">{cert.id}</span>
                      <div className="cert-menu-container">
                        <button 
                          className="cert-menu-btn" 
                          onClick={(e) => toggleMenu(e, cert.id)}
                        >
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                        {activeMenu === cert.id && (
                          <div className="cert-menu-dropdown">
                            <button 
                              className="cert-menu-item" 
                              onClick={(e) => handleEdit(e, cert.id)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="cert-menu-item cert-menu-item-delete" 
                              onClick={(e) => handleDeleteClick(e, cert.id, cert.title)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="modal-backdrop">
              <div className="confirm-modal">
                <div className="confirm-modal-header">
                  <h3>Confirm Delete</h3>
                </div>
                <div className="confirm-modal-body">
                  <p>Are you sure you want to delete the certificate:</p>
                  <p className="certificate-title-to-delete">{certificateToDelete?.title}</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>
                <div className="confirm-modal-footer">
                  <button 
                    className="btn-cancel" 
                    onClick={closeDeleteConfirm}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-delete-confirm" 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificate;
