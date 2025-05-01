import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './editCertificate.css';

const EditCertificate = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    certificateName: '',
    certificateType: '',
    description: '',
    requirements: '',
    status: 'Available'
  });

  // 加载证书数据
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsFetching(true);
        setError(null);
        
        const response = await fetch(`http://localhost:3000/api/fetchCertificates/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch certificate');
        }
        
        const certificate = data.certificate;
        
        // 设置表单数据
        setFormData({
          certificateName: certificate.certificateName,
          certificateType: certificate.certificateType,
          description: certificate.description,
          requirements: certificate.requirements,
          status: certificate.status
        });
      } catch (error) {
        console.error('Error fetching certificate:', error);
        setError(error.message || 'Failed to fetch certificate');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchCertificate();
  }, [id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user info from localStorage
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      
      if (!user || !user.userId) {
        throw new Error('User not logged in');
      }
      
      // Prepare data for API
      const certificateData = {
        ...formData,
        userId: user.userId
      };
      
      // Call API to update certificate
      const response = await fetch(`http://localhost:3000/api/updateCertificates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update certificate');
      }
      
      // Success - redirect to certificate list
      navigate('/admin/certificate');
      
    } catch (error) {
      console.error('Error updating certificate:', error);
      setError(error.message || 'Failed to update certificate');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/certificate');
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Component */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div>
            <h1>Edit Certificate</h1>
            <p>Update certificate information</p>
          </div>
          <div className="user-profile">
            <div className="notifications">
              <i className="far fa-bell"></i>
              <span className="notification-badge">3</span>
            </div>
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&auto=format&fit=crop" alt="Admin" className="user-avatar" />
          </div>
        </div>
        
        <div className="edit-certificate-container">
          <div className="certificate-form-card">
            <div className="certificate-form-header">
              <h2>Certificate Information</h2>
              <p>Update the details for this certification program</p>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {isFetching ? (
              <div className="loading-info">
                <div className="loading-spinner-small"></div>
                <p>Loading certificate data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="certificate-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="certificateName">Certificate Name</label>
                    <input
                      type="text"
                      id="certificateName"
                      name="certificateName"
                      value={formData.certificateName}
                      onChange={handleInputChange}
                      placeholder="Enter certificate name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="certificateType">Certificate Type</label>
                    <select
                      id="certificateType"
                      name="certificateType"
                      value={formData.certificateType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select certificate type</option>
                      <option value="Plant & Animal Care">Plant & Animal Care</option>
                      <option value="Maintenance & Management">Maintenance & Management</option>
                      <option value="Guide & Experience">Guide & Experience</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter certificate description"
                    required
                    rows="4"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="requirements">Requirements</label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    placeholder="Enter certificate requirements (one per line)"
                    required
                    rows="4"
                  ></textarea>
                  <small>Enter each requirement on a new line, prefixed with a dash (-)</small>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-update-certificate"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Certificate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCertificate;
