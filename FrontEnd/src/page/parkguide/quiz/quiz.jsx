import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './quiz.css';

const Quiz = () => {
  const [activeLink, setActiveLink] = useState('certifications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  
  const { id } = useParams(); // topic ID
  const navigate = useNavigate();
  
  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Get current user ID from local storage
        const userData = localStorage.getItem('user');
        let userId = '';
        
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.userId;
        }
        
        const response = await fetch(`http://localhost:3000/api/topics/${id}/quiz?userId=${userId || ''}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load quiz');
        }
        
        setQuizData(data.quiz);
        // Initialize time left in seconds
        setTimeLeft(data.quiz.timeLimit * 60);
        
        // Initialize answers object with empty values
        const initialAnswers = {};
        data.quiz.questions.forEach(question => {
          initialAnswers[question.id] = question.type === 'multiple' ? [] : null;
        });
        setAnswers(initialAnswers);
        
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Failed to load quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id]);
  
  // Timer countdown
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || quizSubmitted) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, quizSubmitted]);
  
  // Auto-submit when time is up
  useEffect(() => {
    if (timeLeft === 0 && !quizSubmitted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, quizSubmitted]);
  
  // Format time as MM:SS
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle single choice selection
  const handleSingleChoice = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  // Handle multiple choice selection
  const handleMultipleChoice = (questionId, optionId) => {
    const currentSelections = answers[questionId] || [];
    
    if (currentSelections.includes(optionId)) {
      // If already selected, remove it
      setAnswers({
        ...answers,
        [questionId]: currentSelections.filter(id => id !== optionId)
      });
    } else {
      // If not selected, add it
      setAnswers({
        ...answers,
        [questionId]: [...currentSelections, optionId]
      });
    }
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (confirmSubmit || timeLeft <= 0) {
      try {
        setLoading(true);
        
        // Get current user ID from local storage
        const userData = localStorage.getItem('user');
        let userId = null;
        
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.userId;
        }
        
        if (!userId) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        // Prepare submission data
        const submissionData = {
          userId: userId,
          topicId: id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId: parseInt(questionId),
            answer: Array.isArray(answer) ? answer : [answer]
          })),
          timeSpent: quizData.timeLimit * 60 - timeLeft
        };
        
        // Submit quiz
        const response = await fetch('http://localhost:3000/api/quiz-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit quiz');
        }
        
        setQuizSubmitted(true);
        setResults(data.results);
        
      } catch (err) {
        console.error('Error submitting quiz:', err);
        setError(err.message || 'Failed to submit quiz. Please try again.');
      } finally {
        setLoading(false);
        setConfirmSubmit(false);
      }
    } else {
      // Show confirmation dialog
      setConfirmSubmit(true);
    }
  };
  
  // Handle back to topic
  const handleBackToTopic = () => {
    navigate(`/parkguide/topic/${id}`);
  };
  
  // Handle retry quiz
  const handleRetryQuiz = () => {
    // Reload the page to restart the quiz
    window.location.reload();
  };
  
  // Render question based on type
  const renderQuestion = (question) => {
    return (
      <div className="quiz-question" key={question.id}>
        <h3 className="question-text">{currentQuestion + 1}. {question.text}</h3>
        
        {question.type === 'single' ? (
          <div className="options-list single-choice">
            {question.options.map(option => (
              <div 
                className={`option-item ${answers[question.id] === option.id ? 'selected' : ''}`} 
                key={option.id}
                onClick={() => handleSingleChoice(question.id, option.id)}
              >
                <div className="option-marker">
                  <div className="option-radio"></div>
                </div>
                <div className="option-content">{option.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="options-list multiple-choice">
            {question.options.map(option => (
              <div 
                className={`option-item ${answers[question.id]?.includes(option.id) ? 'selected' : ''}`} 
                key={option.id}
                onClick={() => handleMultipleChoice(question.id, option.id)}
              >
                <div className="option-marker">
                  <div className="option-checkbox"></div>
                </div>
                <div className="option-content">{option.text}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="question-note">
          {question.type === 'multiple' && <p>Note: This question allows multiple selections.</p>}
        </div>
      </div>
    );
  };
  
  // Render results
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="quiz-results">
        <div className={`result-header ${results.passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">
            {results.passed ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-times-circle"></i>
            )}
          </div>
          <div className="result-text">
            <h2>{results.passed ? 'Quiz Passed!' : 'Quiz Failed'}</h2>
            <p>
              {results.passed 
                ? 'Congratulations! You have successfully completed this quiz.' 
                : 'Unfortunately, you did not meet the passing criteria. Please review the materials and try again.'}
            </p>
          </div>
        </div>
        
        <div className="score-summary">
          <div className="score-item">
            <div className="score-label">Your Score</div>
            <div className="score-value">{results.score}%</div>
          </div>
          <div className="score-item">
            <div className="score-label">Passing Score</div>
            <div className="score-value">{results.passingScore}%</div>
          </div>
          <div className="score-item">
            <div className="score-label">Time Spent</div>
            <div className="score-value">{formatTime(results.timeSpent)}</div>
          </div>
        </div>
        
        <div className="question-summary">
          <h3>Question Summary</h3>
          <div className="summary-progress-bar">
            <div className="correct-answers" style={{width: `${results.correctPercentage}%`}}></div>
            <div className="incorrect-answers" style={{width: `${100 - results.correctPercentage}%`}}></div>
          </div>
          <div className="summary-labels">
            <div className="correct-label">
              <span className="dot correct"></span>
              <span>Correct: {results.correctCount}/{results.totalQuestions}</span>
            </div>
            <div className="incorrect-label">
              <span className="dot incorrect"></span>
              <span>Incorrect: {results.totalQuestions - results.correctCount}/{results.totalQuestions}</span>
            </div>
          </div>
        </div>
        
        {/* 详细答题结果 */}
        {/* {results.detailedResults && (
          <div className="detailed-results">
            <h3>Detailed Question Results</h3>
            <div className="results-accordion">
              {results.detailedResults.map((result, index) => (
                <div className="result-item" key={result.questionId}>
                  <div className={`result-item-header ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="question-number">Question {index + 1}</div>
                    <div className="question-status">
                      {result.isCorrect ? (
                        <span className="status-icon correct"><i className="fas fa-check"></i> Correct</span>
                      ) : (
                        <span className="status-icon incorrect"><i className="fas fa-times"></i> Incorrect</span>
                      )}
                    </div>
                  </div>
                  <div className="result-item-details">
                    <div className="result-reason">
                      <strong>{result.reason}</strong>
                    </div>
                    <div className="answer-comparison">
                      <div className="your-answer">
                        <div className="answer-label">Your Answer:</div>
                        <div className="answer-value">
                          {result.userAnswerTexts && result.userAnswerTexts.length > 0 
                            ? result.userAnswerTexts.join(', ')
                            : 'No answer provided'}
                        </div>
                      </div>
                      <div className="correct-answer">
                        <div className="answer-label">Correct Answer:</div>
                        <div className="answer-value">
                          {result.correctAnswerTexts && result.correctAnswerTexts.length > 0
                            ? result.correctAnswerTexts.join(', ')
                            : 'No correct answer defined'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
        
        <div className="result-actions">
          <button className="btn-back-to-topic" onClick={handleBackToTopic}>
            Back to Topic
          </button>
          {!results.passed && (
            <button className="btn-retry-quiz" onClick={handleRetryQuiz}>
              Retry Quiz
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (loading && !quizData) {
    return (
      <div className="dashboard-container">
        <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz...</p>
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
            <button onClick={handleBackToTopic} className="btn-back">
              Back to Topic
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show quiz content
  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      <div className="main-content">
        {quizData && (
          <div className="quiz-container">
            {!quizSubmitted ? (
              <>
                <div className="quiz-header">
                  <h1 className="quiz-title">{quizData.title}</h1>
                  <div className="quiz-meta">
                    <div className="questions-count">
                      <i className="fas fa-list-ol"></i>
                      {quizData.questions.length} Questions
                    </div>
                    <div className="passing-score">
                      <i className="fas fa-award"></i>
                      Passing: {quizData.passingScore}%
                    </div>
                    <div className="time-limit">
                      <i className="fas fa-clock"></i>
                      Time Left: <span className={timeLeft < 60 ? 'time-running-out' : ''}>{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                  
                  <div className="quiz-progress">
                    <div className="progress-text">
                      Question {currentQuestion + 1} of {quizData.questions.length}
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar"
                        style={{width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="quiz-content">
                  {quizData.questions[currentQuestion] && renderQuestion(quizData.questions[currentQuestion])}
                </div>
                
                <div className="quiz-navigation">
                  <button 
                    className="btn-prev"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestion === 0}
                  >
                    <i className="fas fa-arrow-left"></i> Previous
                  </button>
                  
                  {currentQuestion < quizData.questions.length - 1 ? (
                    <button className="btn-next" onClick={handleNextQuestion}>
                      Next <i className="fas fa-arrow-right"></i>
                    </button>
                  ) : (
                    <button className="btn-submit" onClick={handleSubmitQuiz}>
                      Submit Quiz
                    </button>
                  )}
                </div>
                
                {confirmSubmit && (
                  <div className="confirmation-modal">
                    <div className="confirmation-content">
                      <h3>Submit Quiz?</h3>
                      <p>Are you sure you want to submit your quiz? You won't be able to change your answers afterward.</p>
                      <div className="confirmation-actions">
                        <button className="btn-cancel" onClick={() => setConfirmSubmit(false)}>
                          Cancel
                        </button>
                        <button className="btn-confirm" onClick={handleSubmitQuiz}>
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              renderResults()
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
