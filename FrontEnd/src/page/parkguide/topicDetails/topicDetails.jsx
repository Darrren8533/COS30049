import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './topicDetails.css';

const TopicDetails = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [userProgress, setUserProgress] = useState({
    status: 'Not Started',
    progress: 0,
    materialsViewed: 0,
    totalMaterials: 0
  });

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

  // Fetch topic data and progress from API
  useEffect(() => {
    const fetchTopicAndProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user ID from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser.userId;
        
        // Fetch topic data
        const topicResponse = await fetch(`http://localhost:3000/api/topics/${id}`);
        const topicData = await topicResponse.json();
        
        
        if (topicResponse.ok && topicData.success) {
          setTopic(topicData.topic);
          
          // 从topic中提取certificate ID
          const certificateId = topicData.topic.certificationLink ? 
                               topicData.topic.certificationLink.split('/').pop() : 
                               topicData.topic.certificateId;
          
          // Fetch progress data using the correct certificate ID
          if (userId && certificateId) {
            const progressResponse = await fetch(`http://localhost:3000/api/certificates/${certificateId}/progress?userId=${userId}`);
            
            const progressData = await progressResponse.json();
            
            if (progressResponse.ok && progressData.success) {
              // 从progressData.certificate中获取数据，而不是直接从progressData获取
              const certificateData = progressData.certificate || {};
              
              setUserProgress({
                status: certificateData.status || 'Not Started',
                progress: certificateData.progress || 0,
                materialsViewed: certificateData.materialsViewed || 0,
                totalMaterials: topicData.topic.materials?.length || 0
              });
              console.log('User Progress:', progressData);
              console.log('User Progress Status:', certificateData.status);
            }
            
            // Fetch quiz attempts if any
            try {
              const attemptsResponse = await fetch(`http://localhost:3000/api/users/${userId}/topics/${id}/quiz-attempts`);
              const attemptsData = await attemptsResponse.json();
              
              if (attemptsResponse.ok && attemptsData.success) {
                setQuizAttempts(attemptsData.attempts || []);
              }
            } catch (attemptError) {
              console.error('Error fetching quiz attempts:', attemptError);
              // 不中断主流程，只是记录错误并使用空数组
              setQuizAttempts([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError(err.message || 'Failed to load topic data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTopicAndProgress();
    }
  }, [id]);

  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };

  // Handle material download
  const handleDownloadMaterial = (material) => {
    // Create a direct download link to the API
    const downloadUrl = `http://localhost:3000/api/materials/${material.id}/download`;
    
    // Record that user viewed/downloaded this material
    recordMaterialView(material.id);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', material.title); // Suggest filename
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Record that user viewed a material
  const recordMaterialView = async (materialId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.userId;
      
      if (!userId) return;
      
      await fetch(`http://localhost:3000/api/users/${userId}/materials/${materialId}/view`, {
        method: 'POST'
      });
      
      // Update local state to reflect the view
      setUserProgress(prev => ({
        ...prev,
        materialsViewed: prev.materialsViewed + 1,
        progress: Math.min(
          100, 
          Math.round(((prev.materialsViewed + 1) / prev.totalMaterials) * 50)
        ) // Progress is 50% materials, 50% quiz
      }));
    } catch (err) {
      console.error('Error recording material view:', err);
    }
  };
  
  // Handle taking the quiz
  const handleTakeQuiz = () => {
    navigate(`/parkguide/quiz/${id}`);
  };

  // Show loading state
  if (loading && !topic) {
    return (
      <div className="dashboard-container">
        <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading topic data...</p>
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
    <div className="dashboard-container">
      {/* Sidebar Component */}
      <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        {topic && (
          <>
            <div className="topic-header">
              <div className="topic-title-section">
                <button onClick={handleBack} className="back-button">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                  <h1 className="topic-title">{topic.title}</h1>
                  <p className="topic-certification">
                    Part of <Link to={`/parkguide/progress-details/${topic.certificateId}`}>{topic.certification}</Link>
                  </p>
                </div>
              </div>
              <div className="topic-progress-badge">
                <span className={`status-badge ${userProgress.status.toLowerCase().replace(' ', '-')}`}>
                  {userProgress.status}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            {/* <div className="topic-progress-section">
              <div className="progress-header">
                <span>Overall Progress</span>
                <span className="progress-percent">{userProgress.progress}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{width: `${userProgress.progress}%`}}></div>
              </div>
              <p className="materials-viewed">{userProgress.materialsViewed} of {userProgress.totalMaterials} materials viewed</p>
            </div> */}
            
            <div className="topic-tabs">
              <button 
                className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <i className="fas fa-book"></i> Learning Materials
              </button>
              <button 
                className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                <i className="fas fa-question-circle"></i> Quiz
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
                    <h2>Learning Materials</h2>
                    <p>Review all learning materials to prepare for the quiz</p>
                  </div>
                  
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
                          <button 
                            className="material-download-btn"
                            onClick={() => handleDownloadMaterial(material)}
                          >
                            <i className="fas fa-download"></i> Download
                          </button>
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
                    <h2>Topic Quiz</h2>
                    <p>Test your knowledge to complete this topic</p>
                  </div>
                  
                  {topic.quiz ? (
                    <div className="quiz-info">
                      <div className="quiz-info-text">
                        <h3>{topic.quiz.title}</h3>
                        <p>{topic.quiz.questionCount} questions • Passing score: {topic.quiz.passingScore}</p>
                        <p>Time limit: {topic.quiz.timeLimit} minutes</p>
                      </div>
                      
                      {quizAttempts.length > 0 && (
                        <div className="quiz-attempts">
                          <h3>Previous Attempts</h3>
                          <div className="attempts-list">
                            {quizAttempts.map((attempt, index) => (
                              <div key={index} className="attempt-item">
                                <div className="attempt-date">
                                  <i className="fas fa-calendar"></i> {new Date(attempt.date).toLocaleDateString()}
                                </div>
                                <div className="attempt-score">
                                  <i className="fas fa-chart-simple"></i> Score: {attempt.score}%
                                </div>
                                <div className={`attempt-result ${attempt.passed ? 'passed' : 'failed'}`}>
                                  {attempt.passed ? 'Passed' : 'Failed'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button 
                        className="btn-take-quiz"
                        onClick={handleTakeQuiz}
                      >
                        {quizAttempts.some(a => a.passed) ? 'Retake Quiz' : 'Take Quiz'}
                      </button>
                    </div>
                  ) : (
                    <div className="no-quiz-message">
                      <p>No quiz is available for this topic yet.</p>
                      <p>Please check back later or contact your administrator.</p>
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

export default TopicDetails;
