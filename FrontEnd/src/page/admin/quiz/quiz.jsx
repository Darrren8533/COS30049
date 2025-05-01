import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './quiz.css';

const Quiz = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  // Add loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch quiz data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if the response has a nested quiz structure
        if (data.success && data.quiz) {
          setQuizData(data.quiz);
        } else if (data.success === false && response.status === 404) {
          // Quiz not found (404) but request was successful
          setQuizData(null);
        } else {
          setQuizData(data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchQuizData();
    }
  }, [topicId]);
  
  // Edit mode state for questions
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  // State for editing question
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState({
    text: '',
    type: 'single',
    options: [
      { id: 'A', text: '', isCorrect: false },
      { id: 'B', text: '', isCorrect: false },
      { id: 'C', text: '', isCorrect: false },
      { id: 'D', text: '', isCorrect: false }
    ]
  });
  
  // State for quiz settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState({
    title: '',
    description: '',
    passingScore: 0,
    timeLimit: 0
  });
  
  // State for add question modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'single',
    options: [
      { id: 'A', text: '', isCorrect: false },
      { id: 'B', text: '', isCorrect: false },
      { id: 'C', text: '', isCorrect: false },
      { id: 'D', text: '', isCorrect: false }
    ]
  });
  
  // Function to handle quiz settings changes
  const handleQuizSettingsClick = () => {
    if (!quizData) return;
    
    // Set editing settings with current quiz data
    setEditingSettings({
      title: quizData.title,
      description: quizData.description,
      passingScore: quizData.passingScore,
      timeLimit: quizData.timeLimit
    });
    
    // Show settings modal
    setShowSettingsModal(true);
  };
  
  // Function to handle input changes in settings form
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setEditingSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to save quiz settings
  const handleSaveSettings = async () => {
    try {
      // Prepare settings data
      const settingsToSave = {
        id: quizData.id,
        title: editingSettings.title,
        description: editingSettings.description,
        passingScore: parseInt(editingSettings.passingScore, 10),
        timeLimit: parseInt(editingSettings.timeLimit, 10)
      };

      // Call API to update settings
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave)
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local data
        setQuizData(prev => ({
          ...prev,
          title: editingSettings.title,
          description: editingSettings.description,
          passingScore: parseInt(editingSettings.passingScore, 10),
          timeLimit: parseInt(editingSettings.timeLimit, 10)
        }));
        
        // Close settings modal
        setShowSettingsModal(false);
      } else {
        throw new Error(result.message || 'An unknown error occurred while saving settings');
      }
    } catch (error) {
      console.error('Error saving quiz settings:', error);
      alert(`Failed to save settings: ${error.message}`);
    }
  };
  
  // Function to close settings modal
  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
  };
  
  // Function to open add question modal
  const handleAddQuestion = () => {
    // Reset new question form
    setNewQuestion({
      text: '',
      type: 'single',
      options: [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false }
      ]
    });
    
    // Show add question modal
    setShowAddQuestionModal(true);
  };
  
  // Function to handle question text change
  const handleQuestionTextChange = (e) => {
    setNewQuestion(prev => ({
      ...prev,
      text: e.target.value
    }));
  };
  
  // Function to handle question type change
  const handleQuestionTypeChange = (type) => {
    setNewQuestion(prev => ({
      ...prev,
      type: type
    }));
  };
  
  // Function to handle option text change
  const handleOptionTextChange = (optionId, text) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === optionId ? { ...option, text } : option
      )
    }));
  };
  
  // Function to handle correct answer selection
  const handleCorrectAnswerChange = (optionId) => {
    // For single answer questions, only one option can be correct
    if (newQuestion.type === 'single') {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.map(option => ({
          ...option,
          isCorrect: option.id === optionId
        }))
      }));
    } else {
      // For multiple answer questions, toggle the selected option
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.map(option => 
          option.id === optionId ? { ...option, isCorrect: !option.isCorrect } : option
        )
      }));
    }
  };
  
  // Function to add the new question
  const handleAddQuestionSubmit = async () => {
    // Validate form
    if (!newQuestion.text.trim()) {
      alert('Please enter a question');
      return;
    }
    
    // Make sure at least one option is selected as correct
    if (!newQuestion.options.some(option => option.isCorrect)) {
      alert('Please select at least one correct answer');
      return;
    }
    
    // Make sure all options have text
    if (newQuestion.options.some(option => !option.text.trim())) {
      alert('Please provide text for all options');
      return;
    }
    
    try {
      // Call API to add new question
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quizData.id,
          text: newQuestion.text,
          type: newQuestion.type,
          options: newQuestion.options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add question: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Add question to quiz data
        setQuizData(prev => ({
          ...prev,
          questions: [...prev.questions, result.question]
        }));
        
        // Close modal
        setShowAddQuestionModal(false);
      } else {
        throw new Error(result.message || 'An unknown error occurred while adding question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert(`Failed to add question: ${error.message}`);
    }
  };
  
  // Function to close add question modal
  const handleCloseAddQuestionModal = () => {
    setShowAddQuestionModal(false);
  };
  
  // Function to edit a question
  const handleEditQuestion = (questionId) => {
    const questionToEdit = quizData.questions.find(q => q.id === questionId);
    if (!questionToEdit) return;
    
    // Set the question data to edit
    setEditingQuestion({
      id: questionToEdit.id,
      text: questionToEdit.text,
      type: questionToEdit.type,
      options: [...questionToEdit.options]
    });
    
    // Set the editing question ID
    setEditingQuestionId(questionId);
    
    // Show the edit question modal
    setShowEditQuestionModal(true);
  };
  
  // Function to delete a question
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        // Call API to delete the question
        const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete question: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Update local state by removing the deleted question
          setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
          }));
        } else {
          throw new Error(result.message || 'An unknown error occurred while deleting question');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert(`Failed to delete question: ${error.message}`);
      }
    }
  };
  
  // Function to save quiz
  const handleSaveQuiz = async () => {
    try {
      // Prepare the data for API request
      const quizToSave = {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        questions: quizData.questions
      };

      // Make API call to save the quiz
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizToSave)
      });

      if (!response.ok) {
        throw new Error(`Failed to save quiz: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Quiz saved successfully!');
      } else {
        throw new Error(result.message || 'Unknown error occurred while saving quiz');
      }
      
      // Navigate back to topic page
      navigate(-1);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert(`Failed to save quiz: ${error.message}`);
    }
  };
  
  // Function to go back to topic
  const handleBackToTopic = () => {
    // Navigate back to previous page
    navigate(-1);
  };

  // Function to retry loading data if error occurs
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-trigger useEffect by updating a dependency
    setQuizData(null);
  };
  
  // Function to create a new quiz
  const handleCreateQuiz = async () => {
    try {
      // Prepare default quiz data
      const defaultQuiz = {
        title: 'New Quiz',
        description: 'This is a quiz to test student knowledge.',
        passingScore: 70,
        timeLimit: 30
      };

      // Call API to create quiz
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultQuiz)
      });

      if (!response.ok) {
        throw new Error(`Failed to create quiz: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Set the newly created quiz data
        setQuizData(result.quiz);
        
        // Set edit mode, immediately open settings dialog
        setEditingSettings({
          title: result.quiz.title,
          description: result.quiz.description,
          passingScore: result.quiz.passingScore,
          timeLimit: result.quiz.timeLimit
        });
        
        // Show settings dialog
        setShowSettingsModal(true);
      } else {
        throw new Error(result.message || 'An unknown error occurred while creating quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(`Failed to create quiz: ${error.message}`);
    }
  };
  
  // Function to handle editing question text change
  const handleEditQuestionTextChange = (e) => {
    setEditingQuestion(prev => ({
      ...prev,
      text: e.target.value
    }));
  };
  
  // Function to handle editing question type change
  const handleEditQuestionTypeChange = (type) => {
    setEditingQuestion(prev => ({
      ...prev,
      type: type
    }));
  };
  
  // Function to handle editing option text change
  const handleEditOptionTextChange = (optionId, text) => {
    setEditingQuestion(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === optionId ? { ...option, text } : option
      )
    }));
  };
  
  // Function to handle editing correct answer selection
  const handleEditCorrectAnswerChange = (optionId) => {
    // For single answer questions, only one option can be correct
    if (editingQuestion.type === 'single') {
      setEditingQuestion(prev => ({
        ...prev,
        options: prev.options.map(option => ({
          ...option,
          isCorrect: option.id === optionId
        }))
      }));
    } else {
      // For multiple answer questions, toggle the selected option
      setEditingQuestion(prev => ({
        ...prev,
        options: prev.options.map(option => 
          option.id === optionId ? { ...option, isCorrect: !option.isCorrect } : option
        )
      }));
    }
  };
  
  // Function to save the edited question
  const handleSaveEditedQuestion = async () => {
    try {
      // Validate form
      if (!editingQuestion.text.trim()) {
        alert('Please enter a question');
        return;
      }
      
      // Make sure at least one option is selected as correct
      if (!editingQuestion.options.some(option => option.isCorrect)) {
        alert('Please select at least one correct answer');
        return;
      }
      
      // Make sure all options have text
      if (editingQuestion.options.some(option => !option.text.trim())) {
        alert('Please provide text for all options');
        return;
      }
      
      // Call API to update the question
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}/quiz/questions/${editingQuestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editingQuestion.text,
          type: editingQuestion.type,
          options: editingQuestion.options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update question: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update quiz data with edited question
        setQuizData(prev => ({
          ...prev,
          questions: prev.questions.map(q => 
            q.id === editingQuestionId ? {...result.question} : q
          )
        }));
        
        // Close edit modal and reset state
        setShowEditQuestionModal(false);
        setEditingQuestionId(null);
      } else {
        throw new Error(result.message || 'An unknown error occurred while updating question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert(`Failed to update question: ${error.message}`);
    }
  };
  
  // Function to close edit question modal
  const handleCloseEditQuestionModal = () => {
    setShowEditQuestionModal(false);
    setEditingQuestionId(null);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="error-container">
            <h2>Error Loading Quiz</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button className="btn-retry" onClick={handleRetry}>
                Try Again
              </button>
              <button className="btn-back" onClick={handleBackToTopic}>
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no quiz data is available
  if (!quizData) {
    return (
      <div className="admin-dashboard-container">
        <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="no-quiz-container">
            <div className="back-header">
              <Link to="#" onClick={handleBackToTopic} className="back-link">
                <i className="fas fa-arrow-left"></i> Back to Topic
              </Link>
            </div>
            <div className="no-quiz-content">
              <h2>This topic does not have a quiz yet</h2>
              <p>You can create a new quiz to test student understanding of this topic.</p>
              <button className="btn-create-quiz" onClick={handleCreateQuiz}>
                <i className="fas fa-plus"></i> Create Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-dashboard-container">
      {/* Left Sidebar */}
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="quiz-header">
          <div className="quiz-title-section">
            <Link to="#" onClick={handleBackToTopic} className="back-link">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <div>
                <h1>{quizData.title}</h1>
                <p>Quiz for {quizData.courseName}</p>
            </div>
          </div>
          <button className="btn-edit-settings" onClick={handleQuizSettingsClick}>
            <i className="fas fa-cog"></i> Edit Quiz Settings
          </button>
        </div>
        
        {/* Quiz Information */}
        <div className="quiz-info-container">
          <h2>Quiz Information</h2>
          <p>{quizData.description}</p>
          
          <div className="quiz-stats">
            <div className="quiz-stat-item">
              <h3>Questions</h3>
              <p className="stat-value">{quizData.questions.length}</p>
            </div>
            <div className="quiz-stat-item">
              <h3>Passing Score</h3>
              <p className="stat-value">{quizData.passingScore}%</p>
            </div>
            <div className="quiz-stat-item">
              <h3>Time Limit</h3>
              <p className="stat-value">{quizData.timeLimit} minutes</p>
            </div>
          </div>
        </div>
        
        {/* Quiz Questions */}
        <div className="quiz-questions-container">
          <div className="questions-header">
            <h2>Quiz Questions</h2>
            <p>Manage the questions for this quiz</p>
            <button className="btn-add-question" onClick={handleAddQuestion}>
              <i className="fas fa-plus"></i> Add Question
            </button>
          </div>
          
          <div className="questions-list">
            {quizData.questions.map((question, index) => (
              <div className="question-card" key={question.id}>
                <div className="question-header">
                  <h3>Question {index + 1}: {question.text}</h3>
                  <div className="question-actions">
                    <button 
                      className="btn-edit-question" 
                      onClick={() => handleEditQuestion(question.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-delete-question" 
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <p className="question-type">
                  Multiple Choice ({question.type === 'single' ? 'Single Answer' : 'Multiple Answers'})
                </p>
                
                <div className="question-options">
                  {question.options.map(option => (
                    <div 
                      className={`question-option ${option.isCorrect ? 'correct' : 'incorrect'}`} 
                      key={option.id}
                    >
                      <span className="option-id">{option.id}.</span>
                      <span className="option-text">{option.text}</span>
                      <span className="option-status">
                        {option.isCorrect ? (
                          <i className="fas fa-check correct-icon"></i>
                        ) : (
                          <i className="fas fa-times incorrect-icon"></i>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="quiz-footer">
          <button className="btn-back" onClick={handleBackToTopic}>
            Back to Topic
          </button>
          {/* <button className="btn-save" onClick={handleSaveQuiz}>
            <i className="fas fa-save"></i> Save Quiz
          </button> */}
        </div>
      </div>
      
      {/* Quiz Settings Modal */}
      {showSettingsModal && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>Edit Quiz Settings</h2>
              <p>Update the settings for this quiz.</p>
              <button className="btn-close-modal" onClick={handleCloseSettingsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="settings-modal-body">
              <div className="form-group">
                <label htmlFor="quiz-title">Quiz Title</label>
                <input 
                  type="text" 
                  id="quiz-title" 
                  name="title"
                  value={editingSettings.title}
                  onChange={handleSettingsChange}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quiz-description">Description</label>
                <textarea 
                  id="quiz-description" 
                  name="description"
                  value={editingSettings.description}
                  onChange={handleSettingsChange}
                  className="settings-textarea"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="settings-two-columns">
                <div className="form-group">
                  <label htmlFor="passing-score">Passing Score (%)</label>
                  <input 
                    type="number" 
                    id="passing-score" 
                    name="passingScore"
                    value={editingSettings.passingScore}
                    onChange={handleSettingsChange}
                    className="settings-input"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="time-limit">Time Limit (minutes)</label>
                  <input 
                    type="number" 
                    id="time-limit" 
                    name="timeLimit"
                    value={editingSettings.timeLimit}
                    onChange={handleSettingsChange}
                    className="settings-input"
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="settings-modal-footer">
              <button className="btn-cancel" onClick={handleCloseSettingsModal}>
                Cancel
              </button>
              <button className="btn-save-changes" onClick={handleSaveSettings}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="modal-backdrop">
          <div className="question-modal">
            <div className="question-modal-header">
              <h2>Add New Question</h2>
              <p>Create a new question for this quiz.</p>
              <button className="btn-close-modal" onClick={handleCloseAddQuestionModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="question-modal-body">
              <div className="form-group">
                <label htmlFor="question-text">Question</label>
                <textarea 
                  id="question-text" 
                  value={newQuestion.text}
                  onChange={handleQuestionTextChange}
                  className="question-textarea"
                  placeholder="Enter your question here"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Question Type</label>
                <div className="question-type-options">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="question-type" 
                      checked={newQuestion.type === 'single'} 
                      onChange={() => handleQuestionTypeChange('single')}
                    />
                    <span>Multiple Choice (Single Answer)</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="question-type" 
                      checked={newQuestion.type === 'multiple'} 
                      onChange={() => handleQuestionTypeChange('multiple')}
                    />
                    <span>Multiple Choice (Multiple Answers)</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Answer Options</label>
                <div className="answer-options">
                  {newQuestion.options.map(option => (
                    <div className="answer-option-row" key={option.id}>
                      <label className="option-label">{option.id}.</label>
                      <input 
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                        className="option-input"
                        placeholder={`Option ${option.id}`}
                      />
                      <div className="option-correct">
                        <input 
                          type={newQuestion.type === 'single' ? 'radio' : 'checkbox'}
                          name="correct-answer"
                          checked={option.isCorrect}
                          onChange={() => handleCorrectAnswerChange(option.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="helper-text">
                  Select the radio button next to the correct answer.
                </p>
              </div>
            </div>
            
            <div className="question-modal-footer">
              <button className="btn-cancel" onClick={handleCloseAddQuestionModal}>
                Cancel
              </button>
              <button className="btn-add-question-submit" onClick={handleAddQuestionSubmit}>
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Question Modal */}
      {showEditQuestionModal && (
        <div className="modal-backdrop">
          <div className="question-modal">
            <div className="question-modal-header">
              <h2>Edit Question</h2>
              <p>Edit the details for this question.</p>
              <button className="btn-close-modal" onClick={handleCloseEditQuestionModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="question-modal-body">
              <div className="form-group">
                <label htmlFor="question-text">Question</label>
                <textarea 
                  id="question-text" 
                  value={editingQuestion.text}
                  onChange={handleEditQuestionTextChange}
                  className="question-textarea"
                  placeholder="Enter your question here"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Question Type</label>
                <div className="question-type-options">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="question-type" 
                      checked={editingQuestion.type === 'single'} 
                      onChange={() => handleEditQuestionTypeChange('single')}
                    />
                    <span>Single Choice (Single Answer)</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="question-type" 
                      checked={editingQuestion.type === 'multiple'} 
                      onChange={() => handleEditQuestionTypeChange('multiple')}
                    />
                    <span>Multiple Choice (Multiple Answers)</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Answer Options</label>
                <div className="answer-options">
                  {editingQuestion.options.map(option => (
                    <div className="answer-option-row" key={option.id}>
                      <label className="option-label">{option.id}.</label>
                      <input 
                        type="text"
                        value={option.text}
                        onChange={(e) => handleEditOptionTextChange(option.id, e.target.value)}
                        className="option-input"
                        placeholder={`Option ${option.id}`}
                      />
                      <div className="option-correct">
                        <input 
                          type={editingQuestion.type === 'single' ? 'radio' : 'checkbox'}
                          name="correct-answer"
                          checked={option.isCorrect}
                          onChange={() => handleEditCorrectAnswerChange(option.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="helper-text">
                  Select the radio button next to the correct answer.
                </p>
              </div>
            </div>
            
            <div className="question-modal-footer">
              <button className="btn-cancel" onClick={handleCloseEditQuestionModal}>
                Cancel
              </button>
              <button className="btn-save-changes" onClick={handleSaveEditedQuestion}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
