import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import '../certificate/certificate.css';
import './certificateDetails.css';

const CertificateDetails = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State for certificate data
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for topic modal
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: ''
  });
  
  // Mock topics data (this part won't be changed for now)
  const topics = [
    {
      id: 1,
      title: 'Topic 1: Introduction to Park Management',
      description: 'Overview of park management principles and practices.',
      materials: 2,
      questions: 10
    },
    {
      id: 2,
      title: 'Topic 2: Visitor Safety Protocols',
      description: 'Learn essential visitor safety protocols and emergency procedures.',
      materials: 2,
      questions: 15
    }
  ];
  
  // Fetch certificate data
  useEffect(() => {
    const fetchCertificateAndTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取证书详情
        const certResponse = await fetch(`http://localhost:3000/api/fetchCertificates/${id}`);
        const certData = await certResponse.json();
        
        if (!certResponse.ok) {
          throw new Error(certData.message || 'Failed to fetch certificate');
        }
        
        const certificateData = certData.certificate || certData;
        
        // 获取证书的主题
        const topicsResponse = await fetch(`http://localhost:3000/api/certificates/${id}/topics`);
        const topicsData = await topicsResponse.json();
        
        // 使用API获取的主题，如果API失败则使用默认的模拟主题
        const certificateTopics = topicsResponse.ok && topicsData.success 
          ? topicsData.topics 
          : topics;
        
        // Format the requirements as an array if it's a string
        let requirementsArray = certificateData.requirements || [];
        if (typeof requirementsArray === 'string') {
          requirementsArray = certificateData.requirements
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => line.replace(/^-\s*/, ''));
        }
        
        // Format dates if needed
        const createdAt = certificateData.createdAt 
          ? new Date(certificateData.createdAt).toLocaleString()
          : new Date().toLocaleString();
        const updatedAt = certificateData.updatedAt 
          ? new Date(certificateData.updatedAt).toLocaleString()
          : createdAt;
        
        // Prepare certificate data
        setCertificate({
          id: certificateData.certificateId || certificateData.id || id,
          title: certificateData.certificateName || certificateData.title || 'Untitled Certificate',
          type: certificateData.certificateType || certificateData.type || 'Standard',
          status: certificateData.status || 'Available',
          description: certificateData.description || 'No description available',
          requirements: requirementsArray,
          topics: certificateTopics, // 使用API获取的主题
          auditInfo: {
            createdBy: certificateData.createdBy || 'Admin User',
            createdAt: createdAt,
            lastUpdated: updatedAt
          }
        });
      } catch (error) {
        console.error('Error fetching certificate:', error);
        setError(error.message || 'Failed to fetch certificate');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificateAndTopics();
  }, [id, topics]);
  
  // Handle edit button click
  const handleEditClick = () => {
    navigate(`/admin/certificate/edit/${id}`);
  };
  
  // Handle delete button click
  const handleDeleteClick = async () => {
    if (!window.confirm(`Are you sure you want to delete certificate: ${certificate.title}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3000/api/deleteCertificates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete certificate');
      }
      
      // Navigate back to certificate list
      navigate('/admin/certificate');
      
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert(`Error: ${error.message || 'Failed to delete certificate'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Open topic modal
  const handleAddTopicClick = () => {
    setShowTopicModal(true);
  };
  
  // Close topic modal
  const handleCloseTopicModal = () => {
    setShowTopicModal(false);
    setNewTopic({ title: '', description: '' });
  };
  
  // Handle topic form input changes
  const handleTopicInputChange = (e) => {
    const { name, value } = e.target;
    setNewTopic(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle add topic form submission
  const handleAddTopicSubmit = async () => {
    // Validate inputs
    if (!newTopic.title.trim()) {
      alert('Please enter a topic title');
      return;
    }
    
    try {
      // Set loading state if needed
      // setLoading(true);
      
      // Create topic object for API
      const topicData = {
        title: newTopic.title,
        description: newTopic.description || 'No description provided',
        certificateId: id
      };
      
      // Make API call to create the topic
      const response = await fetch(`http://localhost:3000/api/certificates/${id}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(topicData),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create topic');
      }
      
      // Get the created topic with ID from response
      const createdTopic = data.topic || {
        ...topicData,
        id: Date.now(), // Fallback ID if API doesn't return one
        materials: 0,
        questions: 0
      };
      
      // Update certificate with new topic
      setCertificate(prev => ({
        ...prev,
        topics: [...(prev.topics || []), createdTopic]
      }));
      
      // Close modal and reset form
      handleCloseTopicModal();
      
      console.log('Topic created successfully:', createdTopic);
    } catch (error) {
      console.error('Error creating topic:', error);
      alert(`Error: ${error.message || 'Failed to create topic'}`);
    } finally {
      // Reset loading state if needed
      // setLoading(false);
    }
  };

  // Show loading state
  if (loading && !certificate) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading certificate details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={() => navigate('/admin/certificate')} className="btn-back">
                Back to Certificates
              </button>
              <button onClick={() => window.location.reload()} className="btn-retry">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no certificate data
  if (!certificate) {
    return null;
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Component */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="cert-detail-header">
          <div>
            <h1>{certificate.title}</h1>
            <p>Certificate ID: {certificate.id}</p>
          </div>
          <div className="cert-detail-actions">
            <button className="btn-edit" onClick={handleEditClick}>
              <i className="fas fa-edit"></i> Edit
            </button>
            <button className="btn-delete" onClick={handleDeleteClick}>
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        
        <div className="cert-detail-content">
          {/* Certificate Details Section */}
          <div className="cert-detail-card">
            <div className="cert-detail-section">
              <h2>Certificate Details</h2>
              <p>Basic information about this certificate</p>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-tag"></i>
                </div>
                <div className="detail-content">
                  <h3>Type</h3>
                  <p>{certificate.type}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="detail-content">
                  <h3>Status</h3>
                  <div className={`status-badge ${certificate.status.toLowerCase()}`}>
                    {certificate.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Audit Information */}
          <div className="cert-detail-card">
            <div className="cert-detail-section">
              <h2>Audit Information</h2>
              <p>Creation and modification details</p>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-user"></i>
                </div>
                <div className="detail-content">
                  <h3>Created By</h3>
                  <p>{certificate.auditInfo.createdBy}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="detail-content">
                  <h3>Created At</h3>
                  <p>{certificate.auditInfo.createdAt}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="detail-content">
                  <h3>Last Updated</h3>
                  <p>{certificate.auditInfo.lastUpdated}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description Section */}
          <div className="cert-detail-card full-width">
            <div className="cert-detail-section">
              <h2>Description</h2>
              <p className="cert-description-content">
                {certificate.description}
              </p>
            </div>
          </div>
          
          {/* Requirements Section */}
          <div className="cert-detail-card full-width">
            <div className="cert-detail-section">
              <h2>Requirements</h2>
              <ul className="requirements-list">
                {certificate.requirements && certificate.requirements.length > 0 ? (
                  certificate.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))
                ) : (
                  <li>No specific requirements listed</li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Course Topics Section */}
          <div className="cert-detail-card full-width">
            <div className="cert-detail-section">
              <div className="topics-header">
                <h2>Course Topics</h2>
                <p>Manage course topics, materials, and quizzes</p>
                <button className="btn-add-topic" onClick={handleAddTopicClick}>
                  <i className="fas fa-plus"></i> Add Topic
                </button>
              </div>
              
              <div className="topics-grid">
                {certificate.topics && certificate.topics.length > 0 ? (
                  certificate.topics.map(topic => (
                    <div className="topic-card" key={topic.id}>
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                      <div className="topic-meta">
                        <div className="topic-materials">
                          <i className="fas fa-file-alt"></i> {topic.materials} Materials
                        </div>
                        <div className="topic-questions">
                          <i className="fas fa-question-circle"></i> {topic.questions} Questions
                        </div>
                      </div>
                      <div className="topic-actions">
                        <Link to={`/admin/certificate/${topic.id}/course`} className="btn-manage-topic">Manage Topic</Link>
                        <div className="topic-action-buttons">
                          <button className="btn-edit-topic">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn-delete-topic">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-topics">
                    <p>No topics available for this certificate</p>
                    <p>Click 'Add Topic' to create your first topic</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="cert-detail-footer">
            <Link to="/admin/certificate" className="btn-back">
              Back to Certificates
            </Link>
          </div>
          
        </div>
      </div>
      
      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="modal-overlay">
          <div className="topic-modal">
            <div className="topic-modal-header">
              <h2>Add New Topic</h2>
              <p>Create a new topic for this certification course.</p>
              <button className="btn-close-modal" onClick={handleCloseTopicModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="topic-modal-body">
              <div className="form-group">
                <label htmlFor="topic-title">Topic Title</label>
                <input 
                  type="text" 
                  id="topic-title" 
                  name="title"
                  value={newTopic.title}
                  onChange={handleTopicInputChange}
                  placeholder="Enter topic title"
                  className="topic-form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="topic-description">Description</label>
                <textarea 
                  id="topic-description" 
                  name="description"
                  value={newTopic.description}
                  onChange={handleTopicInputChange}
                  placeholder="Enter topic description"
                  className="topic-form-textarea"
                  rows={4}
                ></textarea>
              </div>
            </div>
            <div className="topic-modal-footer">
              <button className="btn-cancel" onClick={handleCloseTopicModal}>
                Cancel
              </button>
              <button className="btn-add-topic-submit" onClick={handleAddTopicSubmit}>
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateDetails;
