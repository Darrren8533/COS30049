import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, View, Text } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

export default function QuizScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const host = Constants.expoConfig?.extra?.host;
  const { id } = useLocalSearchParams(); // topic ID
  
  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Get current user ID from local storage
        const userData = await AsyncStorage.getItem('user');
        let userId = '';
        
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.userId;
        }
        
        const response = await fetch(`http://${host}:3000/api/topics/${id}/quiz?userId=${userId || ''}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load quiz');
        }
        
        setQuizData(data.quiz);
        // Initialize time left in seconds
        setTimeLeft(data.quiz.timeLimit * 60);
        
        // Initialize answers object with empty values
        const initialAnswers: any = {};
        data.quiz.questions.forEach((question: any) => {
          initialAnswers[question.id] = question.type === 'multiple' ? [] : null;
        });
        setAnswers(initialAnswers);
        
      } catch (err: any) {
        console.error('Error fetching quiz data:', err);
        setError(err.message || 'Unable to load quiz, please try again later.');
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
      setTimeLeft(prevTime => prevTime && prevTime > 0 ? prevTime - 1 : 0);
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
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle single choice selection
  const handleSingleChoice = (questionId: number, optionId: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };
  
  // Handle multiple choice selection
  const handleMultipleChoice = (questionId: number, optionId: number) => {
    const currentSelections = answers[questionId] || [];
    
    if (currentSelections.includes(optionId)) {
      // If already selected, remove it
      setAnswers({
        ...answers,
        [questionId]: currentSelections.filter((id: number) => id !== optionId)
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
    if (quizData && currentQuestion < quizData.questions.length - 1) {
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
    if (confirmSubmit || (timeLeft && timeLeft <= 0)) {
      try {
        setLoading(true);
        
        // Get current user ID from local storage
        const userData = await AsyncStorage.getItem('user');
        let userId = null;
        
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.userId;
        }
        
        if (!userId) {
          throw new Error('User ID not found, please log in again.');
        }
        
        // Prepare submission data
        const submissionData = {
          userId: userId,
          topicId: id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId: parseInt(questionId),
            answer: Array.isArray(answer) ? answer : [answer]
          })),
          timeSpent: quizData.timeLimit * 60 - (timeLeft || 0)
        };
        
        // Submit quiz
        const response = await fetch(`http://${host}:3000/api/quiz-attempts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Quiz submission failed');
        }
        
        setQuizSubmitted(true);
        setResults(data.results);
        
      } catch (err: any) {
        console.error('Error submitting quiz:', err);
        setError(err.message || 'Quiz submission failed, please try again.');
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
    router.replace(`/topic/${id}`);
  };
  
  // Handle retry quiz
  const handleRetryQuiz = () => {
    // Reload the quiz
    setQuizSubmitted(false);
    setCurrentQuestion(0);
    setTimeLeft(quizData.timeLimit * 60);
    const initialAnswers: any = {};
    quizData.questions.forEach((question: any) => {
      initialAnswers[question.id] = question.type === 'multiple' ? [] : null;
    });
    setAnswers(initialAnswers);
    setResults(null);
  };
  
  // Render question based on type
  const renderQuestion = (question: any) => {
    return (
      <View style={styles.quizQuestion} key={question.id}>
        <Text style={styles.questionText}>{currentQuestion + 1}. {question.text}</Text>
        
        {question.type === 'single' ? (
          <View style={styles.optionsList}>
            {question.options.map((option: any) => (
              <TouchableOpacity 
                key={option.id}
                style={[
                  styles.optionItem, 
                  answers[question.id] === option.id && styles.selectedOption
                ]}
                onPress={() => handleSingleChoice(question.id, option.id)}
              >
                <View style={styles.optionMarker}>
                  <View style={[
                    styles.optionRadio,
                    answers[question.id] === option.id && styles.selectedRadio
                  ]} />
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.optionsList}>
            {question.options.map((option: any) => (
              <TouchableOpacity 
                key={option.id}
                style={[
                  styles.optionItem, 
                  answers[question.id]?.includes(option.id) && styles.selectedOption
                ]}
                onPress={() => handleMultipleChoice(question.id, option.id)}
              >
                <View style={styles.optionMarker}>
                  <View style={[
                    styles.optionCheckbox,
                    answers[question.id]?.includes(option.id) && styles.selectedCheckbox
                  ]}>
                    {answers[question.id]?.includes(option.id) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {question.type === 'multiple' && (
          <View style={styles.questionNote}>
            <Text style={styles.noteText}>Note: This question allows multiple selections.</Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render results
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <View style={styles.quizResults}>
        <View style={[
          styles.resultHeader, 
          results.passed ? styles.passedHeader : styles.failedHeader
        ]}>
          <View style={styles.resultIcon}>
            {results.passed ? (
              <Ionicons name="checkmark-circle" size={50} color="#4fe0be" />
            ) : (
              <Ionicons name="close-circle" size={50} color="#FF3B30" />
            )}
          </View>
          <View style={styles.resultText}>
            <Text style={styles.resultTitle}>
              {results.passed ? 'Quiz Passed!' : 'Quiz Failed'}
            </Text>
            <Text style={styles.resultMessage}>
              {results.passed 
                ? 'Congratulations! You have successfully completed the quiz.' 
                : 'Unfortunately, you did not meet the passing criteria. Please review the material and try again.'}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreSummary}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{results.score}%</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Passing Score</Text>
            <Text style={styles.scoreValue}>{results.passingScore}%</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Time Spent</Text>
            <Text style={styles.scoreValue}>{formatTime(results.timeSpent)}</Text>
          </View>
        </View>
        
        <View style={styles.questionSummary}>
          <Text style={styles.summaryTitle}>Question Overview</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.correctAnswers, { width: `${results.correctPercentage}%` }]} />
            <View style={[styles.incorrectAnswers, { width: `${100 - results.correctPercentage}%` }]} />
          </View>
          <View style={styles.summaryLabels}>
            <View style={styles.summaryLabel}>
              <View style={styles.correctDot} />
              <Text style={styles.labelText}>
                Correct: {results.correctCount}/{results.totalQuestions}
              </Text>
            </View>
            <View style={styles.summaryLabel}>
              <View style={styles.incorrectDot} />
              <Text style={styles.labelText}>
                Incorrect: {results.totalQuestions - results.correctCount}/{results.totalQuestions}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.resultActions}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToTopic}
          >
            <Text style={styles.backButtonText}>Back to Topic</Text>
          </TouchableOpacity>
          
          {!results.passed && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetryQuiz}
            >
              <Text style={styles.retryButtonText}>Retry Quiz</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Show loading state
  if (loading && !quizData) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Quiz' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4fe0be" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Quiz' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToTopic}
          >
            <Text style={styles.backButtonText}>Back to Topic</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Show quiz content
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: quizData?.title || 'Quiz' }} />
      
      {quizData && (
        <View style={styles.quizContainer}>
          {!quizSubmitted ? (
            <>
              <LinearGradient
                colors={['#4fe0be', '#23a08d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quizHeader}
              >
                <Text style={styles.quizTitle}>{quizData.title}</Text>
                <View style={styles.quizMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="list" size={16} color="white" />
                    <Text style={styles.metaText}>{quizData.questions.length} questions</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="trophy" size={16} color="white" />
                    <Text style={styles.metaText}>Passing: {quizData.passingScore}%</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={16} color="white" />
                    <Text style={[
                      styles.metaText,
                      timeLeft && timeLeft < 60 ? styles.timeRunningOut : null
                    ]}>
                      Remaining: {timeLeft ? formatTime(timeLeft) : '00:00'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.progressSection}>
                  <Text style={styles.progressText}>
                    Question {currentQuestion + 1} / {quizData.questions.length}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>
              
              <ScrollView style={styles.quizContent}>
                {quizData.questions[currentQuestion] && renderQuestion(quizData.questions[currentQuestion])}
              </ScrollView>
              
              <View style={styles.quizNavigation}>
                <TouchableOpacity 
                  style={[styles.navButton, styles.prevButton, currentQuestion === 0 && styles.disabledButton]}
                  onPress={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  <Ionicons name="arrow-back" size={20} color={currentQuestion === 0 ? "#CCC" : "#4fe0be"} />
                  <Text style={[styles.navButtonText, currentQuestion === 0 && styles.disabledButtonText]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                
                {currentQuestion < quizData.questions.length - 1 ? (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.nextButton]}
                    onPress={handleNextQuestion}
                  >
                    <Text style={styles.navButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#4fe0be" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.submitButton]}
                    onPress={handleSubmitQuiz}
                  >
                    <Text style={styles.submitButtonText}>Submit Quiz</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Modal
                visible={confirmSubmit}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmSubmit(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Submit Quiz?</Text>
                    <Text style={styles.modalText}>
                      Are you sure you want to submit the quiz? Once submitted, you cannot change your answers.
                    </Text>
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => setConfirmSubmit(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.confirmButton}
                        onPress={handleSubmitQuiz}
                      >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <ScrollView style={styles.resultsContainer}>
              {renderResults()}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 20,
  },
  quizContainer: {
    flex: 1,
  },
  quizHeader: {
    padding: 20,
  },
  quizTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  timeRunningOut: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 5,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  quizQuestion: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 20,
  },
  optionsList: {
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    borderColor: '#4fe0be',
    borderWidth: 1,
  },
  optionMarker: {
    marginRight: 15,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#4fe0be',
    backgroundColor: '#4fe0be',
  },
  optionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    borderColor: '#4fe0be',
    backgroundColor: '#4fe0be',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  questionNote: {
    marginTop: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  prevButton: {
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  disabledButton: {
    borderColor: '#CCC',
  },
  nextButton: {
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  submitButton: {
    backgroundColor: '#4fe0be',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: '#4fe0be',
    marginHorizontal: 5,
  },
  disabledButtonText: {
    color: '#CCC',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CCC',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#4fe0be',
  },
  confirmButtonText: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
  },
  quizResults: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  passedHeader: {
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
  },
  failedHeader: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  resultIcon: {
    marginRight: 15,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 16,
    color: '#666',
  },
  scoreSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  questionSummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  correctAnswers: {
    height: '100%',
    backgroundColor: '#4fe0be',
    position: 'absolute',
    left: 0,
  },
  incorrectAnswers: {
    height: '100%',
    backgroundColor: '#FF3B30',
    position: 'absolute',
    right: 0,
  },
  summaryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4fe0be',
    marginRight: 5,
  },
  incorrectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 5,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4fe0be',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#4fe0be',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4fe0be',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 