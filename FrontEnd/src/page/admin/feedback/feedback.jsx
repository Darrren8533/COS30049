import React, { useState, useEffect } from 'react';
import './feedback.css';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';

const AdminFeedback = () => {
  const [activeLink, setActiveLink] = useState('feedback');
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState('');
  const [uniqueGuides, setUniqueGuides] = useState([]);
  const [uniqueVisitors, setUniqueVisitors] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/feedback');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setFeedbackData(data);
        
        // Extract unique guides and visitors for dropdowns
        const guides = [...new Set(data.map(item => item.guide_name))].sort();
        const visitors = [...new Set(data.map(item => item.name))].sort();
        
        setUniqueGuides(guides);
        setUniqueVisitors(visitors);
        setError('');
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        setError('Failed to load feedback data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, []);

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const closeModal = () => {
    setSelectedFeedback(null);
  };

  const handleReset = () => {
    setSelectedGuide('');
    setSelectedVisitor('');
    setFilterRating('all');
    setFeedbackSummary('');
    setShowSummary(false);
  };

  const filteredFeedback = feedbackData.filter(feedback => {
    // Filter by rating
    const ratingMatch = filterRating === 'all' || feedback.rating === parseInt(filterRating);
    
    // Filter by selected guide
    const guideMatch = selectedGuide === '' || feedback.guide_name === selectedGuide;
    
    // Filter by selected visitor
    const visitorMatch = selectedVisitor === '' || feedback.name === selectedVisitor;
    
    return ratingMatch && guideMatch && visitorMatch;
  });

  // Format date helper function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Generate AI summary for feedback
  const generateFeedbackSummary = async () => {
    setSummaryLoading(true);
    setShowSummary(true);
    
    try {
      // Prepare data to send to backend
      const feedbackToSummarize = filteredFeedback;
      const targetGuide = selectedGuide || 'all guides';
      
      const response = await fetch('http://localhost:3000/api/feedback/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackData: feedbackToSummarize,
          guideFilter: targetGuide
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setFeedbackSummary(data.summary);
    } catch (err) {
      console.error('Error generating feedback summary:', err);
      setFeedbackSummary('Failed to generate summary. Please try again later.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="admin-feedback-page">
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      <div className="admin-feedback-container">
        <div className="page-header">
          <div className="header-title">
            <h1>Visitor Feedback Management</h1>
            <p>Review and manage visitor feedback about guides and their experiences.</p>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}
        
        <div className="feedback-filters">
          <div className="filter-group">
            <label htmlFor="guide-filter">
              <i className="fas fa-user-tie"></i> Guide:
            </label>
            <select 
              id="guide-filter" 
              value={selectedGuide}
              onChange={(e) => setSelectedGuide(e.target.value)}
            >
              <option value="">All Guides</option>
              {uniqueGuides.map((guide, index) => (
                <option key={index} value={guide}>{guide}</option>
              ))}
            </select>
          </div>
          
          {/* <div className="filter-group">
            <label htmlFor="visitor-filter">
              <i className="fas fa-user"></i> Visitor:
            </label>
            <select 
              id="visitor-filter" 
              value={selectedVisitor}
              onChange={(e) => setSelectedVisitor(e.target.value)}
            >
              <option value="">All Visitors</option>
              {uniqueVisitors.map((visitor, index) => (
                <option key={index} value={visitor}>{visitor}</option>
              ))}
            </select>
          </div> */}
          
          <div className="filter-group">
            <label htmlFor="rating-filter">
              <i className="fas fa-star"></i> Rating:
            </label>
            <select 
              id="rating-filter" 
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <button className="reset-filters-btn" onClick={handleReset}>
            <i className="fas fa-undo"></i> Reset Filters
          </button>
          
          <button className="generate-summary-btn" onClick={generateFeedbackSummary} disabled={loading || filteredFeedback.length === 0}>
            <i className="fas fa-robot"></i> Generate Summary
          </button>
        </div>
        
        {/* AI Summary Section */}
        {showSummary && (
          <div className="feedback-summary-section">
            <h2>
              <i className="fas fa-chart-pie"></i> 
              Feedback Summary {selectedGuide ? `for ${selectedGuide}` : 'for All Guides'}
            </h2>
            
            {summaryLoading ? (
              <div className="summary-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Analyzing feedback data...</p>
              </div>
            ) : (
              <div className="feedback-summary-content">
                <p>{feedbackSummary}</p>
              </div>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading feedback data...</p>
          </div>
        ) : (
          <>
            <div className="feedback-stats">
              <div className="stat-card">
                <i className="fas fa-comments"></i>
                <div className="stat-content">
                  <h3>{feedbackData.length}</h3>
                  <p>Total Feedback</p>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-star"></i>
                <div className="stat-content">
                  <h3>
                    {feedbackData.length > 0 
                      ? (feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length).toFixed(1)
                      : 0}
                  </h3>
                  <p>Average Rating</p>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-calendar-alt"></i>
                <div className="stat-content">
                  <h3>
                    {feedbackData.length > 0 
                      ? formatDate(feedbackData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at)
                      : 'N/A'}
                  </h3>
                  <p>Latest Feedback</p>
                </div>
              </div>
            </div>

            {filteredFeedback.length > 0 ? (
              <div className="feedback-table-wrapper">
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th>Date Submitted</th>
                      <th>Visitor Name</th>
                      <th>Guide Name</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.map((feedback) => (
                      <tr key={feedback.id}>
                        <td>{formatDate(feedback.created_at)}</td>
                        <td>{feedback.name}</td>
                        <td>{feedback.guide_name}</td>
                        <td>
                          <div className="rating-display">
                            {[...Array(5)].map((_, index) => (
                              <span key={index} className={index < feedback.rating ? 'star active' : 'star'}>★</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewDetails(feedback)}
                          >
                            <i className="fas fa-eye"></i> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-feedback">
                <i className="fas fa-search"></i>
                <p>No feedback found matching your filters. Try adjusting your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <div className="feedback-modal-overlay" onClick={closeModal}>
          <div className="feedback-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            
            <h2>Feedback Details</h2>
            
            <div className="feedback-detail-item">
              <span className="label">Date Submitted:</span>
              <span className="value">{formatDate(selectedFeedback.created_at)}</span>
            </div>
            
            <div className="feedback-detail-item">
              <span className="label">Visitor Name:</span>
              <span className="value">{selectedFeedback.name}</span>
            </div>
            
            <div className="feedback-detail-item">
              <span className="label">Visitor Email:</span>
              <span className="value">{selectedFeedback.email}</span>
            </div>
            
            <div className="feedback-detail-item">
              <span className="label">Guide Name:</span>
              <span className="value">{selectedFeedback.guide_name}</span>
            </div>
            
            <div className="feedback-detail-item">
              <span className="label">Rating:</span>
              <span className="value">
                <div className="rating-display large">
                  {[...Array(5)].map((_, index) => (
                    <span key={index} className={index < selectedFeedback.rating ? 'star active' : 'star'}>★</span>
                  ))}
                </div>
              </span>
            </div>
            
            <div className="feedback-detail-section">
              <h3>Experience with Guide</h3>
              <div className="feedback-text">
                {selectedFeedback.guide_experience || 'No feedback provided about the guide experience.'}
              </div>
            </div>
            
            <div className="feedback-detail-section">
              <h3>Experience at Semenggoh</h3>
              <div className="feedback-text">
                {selectedFeedback.semenggoh_experience}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
