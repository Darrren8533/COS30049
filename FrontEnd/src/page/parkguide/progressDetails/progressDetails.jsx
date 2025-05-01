import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './progressDetails.css';

const ProgressDetails = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default data structure for certificate details
  const [certData, setCertData] = useState({
    id: '',
    title: '',
    type: '',
    description: '',
    progress: 0,
    status: '',
    topicsCompleted: 0,
    totalTopics: 0,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
    requirements: [],
    topics: []
  });
  
  // Fetch certification data
  useEffect(() => {
    const fetchCertificateDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user ID from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser.userId;
        
        // Add userId as a query parameter if available
        const url = userId 
          ? `http://localhost:3000/api/certificates/${id}/progress?userId=${userId}`
          : `http://localhost:3000/api/certificates/${id}/progress`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch certificate details');
        }
        
        if (data.success) {
          // Map API response to component state
          const certificateData = data.certificate;
          
          // Format requirements as array if it's a string
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
          
          setCertData({
            id: certificateData.certificateId || certificateData.id || id,
            title: certificateData.certificateName || certificateData.title || 'Untitled Certificate',
            type: certificateData.certificateType || certificateData.type || 'Standard',
            description: certificateData.description || 'No description available',
            progress: certificateData.progress || 0,
            status: certificateData.status || 'Not Started',
            topicsCompleted: certificateData.topicsCompleted || 0,
            totalTopics: certificateData.totalTopics || 0,
            createdBy: certificateData.createdBy || 'Admin User',
            createdAt: createdAt,
            updatedAt: updatedAt,
            requirements: requirementsArray,
            topics: certificateData.topics || []
          });
        }
      } catch (error) {
        console.error('Error fetching certificate details:', error);
        setError(error.message || 'Failed to fetch certificate details');
        
        // For development fallback - remove in production
        if (process.env.NODE_ENV === 'development') {
          setCertData({
            id: 'CERT-002',
            title: 'Wildlife Guide Certification',
            type: 'Specialized',
            description: 'Specialized certification for guides focusing on wildlife observation and conservation practices.',
            progress: 75,
            status: 'In Progress',
            topicsCompleted: 3,
            totalTopics: 4,
            createdBy: 'Admin User',
            createdAt: '1/10/2024, 8:00:00 AM',
            updatedAt: '4/20/2024, 8:00:00 AM',
            requirements: [
              'Basic knowledge of local wildlife',
              'Good communication skills',
              'Physical fitness for field work',
              'Completion of introductory wildlife course'
            ],
            topics: [
              {
                id: 1,
                title: 'Wildlife Identification',
                description: 'Learn to identify various wildlife species in their natural habitats.',
                materials: 2,
                questions: 20
              },
              {
                id: 2,
                title: 'Habitat and Ecosystem Knowledge',
                description: 'Understanding wildlife habitats and ecosystem interactions.',
                materials: 2,
                questions: 15
              },
              {
                id: 3,
                title: 'Guiding Techniques',
                description: 'Effective techniques for guiding visitors on wildlife tours.',
                materials: 2,
                questions: 18
              },
              {
                id: 4,
                title: 'Wildlife Conservation Ethics',
                description: 'Ethical considerations in wildlife observation and conservation.',
                materials: 2,
                questions: 15
              }
            ]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCertificateDetails();
    }
  }, [id]);
  
  // Navigation
  const handleBack = () => {
    navigate('/parkguide/certifications');
  };
  
  const handleViewTopic = (topicId) => {
    // Navigate to topic details page
    navigate(`/parkguide/topic/${topicId}`);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
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
      <div className="dashboard-container">
        <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={() => window.location.reload()} className="back-to-certificates">
              Try Again
            </button>
            <button onClick={handleBack} className="back-to-certificates">
              Back to Certificates
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        
        
        {/* Certificate header */}
        <div className="certificate-header">
          <div className="back-title">
            <button className="back-button" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="title-section">
              <h1>{certData.title}</h1>
              <p className="certificate-id">Certificate ID: {certData.id}</p>
            </div>
          </div>
          <div className="status-badge">
            <span className="status-in-progress">In Progress</span>
          </div>
        </div>
        
        {/* Certificate Overview */}
        <div className="detail-card">
          <h2 className="card-title">Certificate Overview</h2>
          <p className="certificate-type">{certData.type}</p>
          
          <p className="certificate-description">{certData.description}</p>
          
          <div className="progress-section">
            <div className="progress-header">
              <span>Overall Progress</span>
              <span className="progress-percent">{certData.progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{width: `${certData.progress}%`}}></div>
            </div>
            <p className="topics-completed">{certData.topicsCompleted} of {certData.totalTopics} topics completed</p>
          </div>
        </div>
        
        {/* Two-column layout for Certificate Details and Audit Information */}
        <div className="two-column-layout">
          <div className="detail-card">
            <h2 className="card-title">Certificate Details</h2>
            <p className="card-subtitle">Basic information about this certificate</p>
            
            <div className="detail-item">
              <div className="detail-icon">
                <i className="fas fa-tag"></i>
              </div>
              <div className="detail-content">
                <h3>Type</h3>
                <p>{certData.type}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="detail-content">
                <h3>Status</h3>
                <p className="status-badge-small">{certData.status}</p>
              </div>
            </div>
          </div>
          
          <div className="detail-card">
            <h2 className="card-title">Audit Information</h2>
            <p className="card-subtitle">Creation and modification details</p>
            
            <div className="detail-item">
              <div className="detail-icon">
                <i className="fas fa-user"></i>
              </div>
              <div className="detail-content">
                <h3>Created By</h3>
                <p>{certData.createdBy}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">
                <i className="fas fa-calendar"></i>
              </div>
              <div className="detail-content">
                <h3>Created At</h3>
                <p>{certData.createdAt}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="detail-content">
                <h3>Last Updated</h3>
                <p>{certData.updatedAt}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div className="detail-card">
          <h2 className="card-title">Description</h2>
          <p className="certificate-description">{certData.description}</p>
        </div>
        
        {/* Requirements */}
        <div className="detail-card">
          <h2 className="card-title">Requirements</h2>
          <ul className="requirements-list">
            {certData.requirements.map((req, index) => (
              <li key={index}>- {req}</li>
            ))}
          </ul>
        </div>
        
        {/* Course Topics */}
        <div className="detail-card">
          <h2 className="card-title">Course Topics</h2>
          <p className="card-subtitle">Topics covered in this certification program</p>
          
          <div className="topics-grid">
            {certData.topics.map((topic, index) => (
              <div className="topic-card" key={topic.id}>
                <h3 className="topic-title">Topic {index + 1}: {topic.title}</h3>
                <p className="topic-description">{topic.description}</p>
                
                <div className="topic-meta">
                  <div className="topic-materials">
                    <i className="fas fa-file-alt"></i> {topic.materials} Materials
                  </div>
                  <div className="topic-questions">
                    <i className="fas fa-question-circle"></i> {topic.questions} Questions
                  </div>
                </div>
                
                <button className="view-topic-button" onClick={() => handleViewTopic(topic.id)}>
                  View Topic
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Back to certificates button */}
        <div className="back-link-container">
          <button className="back-to-certificates" onClick={handleBack}>
            Back to Certificates
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressDetails;