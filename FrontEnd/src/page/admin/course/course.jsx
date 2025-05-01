import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './course.css';

const Course = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 30
  });
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();
  const { id } = useParams(); // Get topic ID from URL parameters
  
  // Function to get file icon based on file type
  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf':
        return <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i>;
      case 'video':
        return <i className="fas fa-file-video" style={{ color: '#3498db' }}></i>;
      case 'presentation':
        return <i className="fas fa-file-powerpoint" style={{ color: '#e67e22' }}></i>;
      default:
        return <i className="fas fa-file" style={{ color: '#7f8c8d' }}></i>;
    }
  };

  // Fetch topic data from API
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/topics/${id}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setTopic(data.topic);
        } else {
          setError('Failed to load topic data');
        }
      } catch (err) {
        console.error('Error fetching topic:', err);
        setError('Failed to load topic data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTopic();
    }
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // Create FormData object
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload the file
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Promise to handle the response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload'));
        };
      });

      // Open connection and send the file
      xhr.open('POST', `http://localhost:3000/api/topics/${id}/materials`);
      xhr.send(formData);

      // Wait for the upload to complete
      const response = await uploadPromise;

      // Add the new material to the topic's materials list
      if (response.success && response.material) {
        setTopic(prevTopic => ({
          ...prevTopic,
          materials: [response.material, ...prevTopic.materials]
        }));
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the file input to allow uploading the same file again
      e.target.value = null;
    }
  };

  // Handle material deletion
  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/materials/${materialId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove the deleted material from the list
        setTopic(prevTopic => ({
          ...prevTopic,
          materials: prevTopic.materials.filter(material => material.id !== materialId)
        }));
      } else {
        throw new Error(data.message || 'Failed to delete material');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle material download
  const handleDownloadMaterial = (material) => {
    // Create a direct download link to the API
    const downloadUrl = `http://localhost:3000/api/materials/${material.id}/download`;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', material.title); // Suggest filename
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Quiz Modal
  const openQuizModal = () => {
    setShowQuizModal(true);
  };
  
  const closeQuizModal = () => {
    setShowQuizModal(false);
    // Reset form data
    setQuizData({
      title: '',
      description: '',
      passingScore: 70,
      timeLimit: 30
    });
  };
  
  const handleQuizInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    if (name === 'passingScore' || name === 'timeLimit') {
      setQuizData({
        ...quizData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setQuizData({
        ...quizData,
        [name]: value
      });
    }
  };
  
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!quizData.title) {
      alert('Please enter a quiz title');
      return;
    }
    
    if (quizData.passingScore < 0 || quizData.passingScore > 100) {
      alert('Passing score must be between 0 and 100');
      return;
    }
    
    if (quizData.timeLimit < 1) {
      alert('Time limit must be at least 1 minute');
      return;
    }
    
    try {
      setIsCreatingQuiz(true);
      
      // Call API to create quiz
      const response = await fetch(`http://localhost:3000/api/topics/${id}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update topic with new quiz
        setTopic({
          ...topic,
          quiz: {
            title: data.quiz.title,
            questionCount: 0,
            passingScore: data.quiz.passingScore + '%'
          }
        });
        
        // Close modal
        closeQuizModal();
        
        // Optionally redirect to quiz management page
        if (window.confirm('Quiz created successfully! Do you want to add questions now?')) {
          navigate(`/admin/quiz/${id}`);
        }
      } else {
        throw new Error(data.message || 'Failed to create quiz');
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Show loading state
  if (loading && !topic) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="loading-container">
            <p>Loading topic data...</p>
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
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="btn-back">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show main content when data is loaded
  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Component */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* File input (hidden) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png"
      />
      
      {/* Quiz Creation Modal */}
      {showQuizModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Create Quiz</h2>
              <button className="close-button" onClick={closeQuizModal}>×</button>
            </div>
            <form onSubmit={handleCreateQuiz}>
              <div className="form-group">
                <label htmlFor="quizTitle">Quiz Title:</label>
                <input
                  id="quizTitle"
                  type="text"
                  name="title"
                  value={quizData.title}
                  onChange={handleQuizInputChange}
                  placeholder="Enter quiz title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="quizDescription">Description:</label>
                <textarea
                  id="quizDescription"
                  name="description"
                  value={quizData.description}
                  onChange={handleQuizInputChange}
                  placeholder="Quiz description (optional)"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="passingScore">Passing Score (%):</label>
                  <input
                    id="passingScore"
                    type="number"
                    name="passingScore"
                    value={quizData.passingScore}
                    onChange={handleQuizInputChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group half">
                  <label htmlFor="timeLimit">Time Limit (minutes):</label>
                  <input
                    id="timeLimit"
                    type="number"
                    name="timeLimit"
                    value={quizData.timeLimit}
                    onChange={handleQuizInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeQuizModal}
                  disabled={isCreatingQuiz}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={isCreatingQuiz}
                >
                  {isCreatingQuiz ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Creating...
                    </>
                  ) : (
                    'Create Quiz'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="main-content">
        {topic && (
          <>
            <div className="topic-header">
              <div className="topic-title-section">
                <Link to="#" onClick={handleBack} className="back-link">
                  <i className="fas fa-arrow-left"></i>
                </Link>
                <div>
                  <h1 className="topic-title">{topic.title}</h1>
                  <p className="topic-certification">
                    Part of <Link to={topic.certificationLink}>{topic.certification}</Link>
                  </p>
                </div>
              </div>
              <div className="topic-actions">
                <button className="btn-edit-topic">
                  <i className="fas fa-edit"></i> Edit Topic
                </button>
              </div>
            </div>
            
            <div className="topic-tabs">
              <button 
                className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                Content & Materials
              </button>
              <button 
                className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                Quiz
              </button>
            </div>
            
            {activeTab === 'content' ? (
              <div className="topic-content">
                <div className="topic-description-card">
                  <h2>Topic Description</h2>
                  <p>{topic.description}</p>
                </div>
                
                <div className="topic-materials-card">
                  <div className="card-header">
                    <h2>Course Materials</h2>
                    <p>Upload and manage learning materials for this topic</p>
                    <button 
                      className="btn-upload-material"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> 
                          Uploading ({uploadProgress}%)
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload"></i> Upload Material
                        </>
                      )}
                    </button>
                  </div>
                  
                  {uploadError && (
                    <div className="upload-error-message">
                      Error: {uploadError}
                    </div>
                  )}
                  
                  <div className="materials-list">
                    {topic.materials && topic.materials.length > 0 ? (
                      topic.materials.map(material => (
                        <div className="material-item" key={material.id}>
                          <div className="material-icon">
                            {getFileIcon(material.type)}
                          </div>
                          <div className="material-info">
                            <h3 className="material-title">{material.title}</h3>
                            <p className="material-meta">{material.size} • Uploaded on {new Date(material.uploadDate).toLocaleDateString()}</p>
                          </div>
                          <div className="material-actions">
                            <div className="dropdown">
                              <button className="material-menu-btn">
                                <i className="fas fa-ellipsis-h"></i>
                              </button>
                              <div className="dropdown-content">
                                <button onClick={() => handleDownloadMaterial(material)}>
                                  <i className="fas fa-download"></i> Download
                                </button>
                                <button onClick={() => handleDeleteMaterial(material.id)}>
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-materials-message">No materials available for this topic yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="topic-quiz">
                <div className="quiz-card">
                  <div className="card-header">
                    <h2>Online Quiz</h2>
                    <p>Create and manage quiz questions for this topic</p>
                  </div>
                  
                  {topic.quiz ? (
                    <div className="quiz-info">
                      <div className="quiz-info-text">
                        <h3>{topic.quiz.title}</h3>
                        <p>{topic.quiz.questionCount} questions • Passing score: {topic.quiz.passingScore}</p>
                      </div>
                      <button className="btn-manage-questions">
                        <Link to={`/admin/quiz/${topic.id}`}>
                          <i className="fas fa-list-ol"></i> Manage Questions
                        </Link>
                      </button>
                    </div>
                  ) : (
                    <div className="no-quiz-message">
                      <p>No quiz has been created for this topic yet.</p>
                      <button className="btn-create-quiz" onClick={openQuizModal}>
                        <i className="fas fa-plus"></i> Create Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Course;
