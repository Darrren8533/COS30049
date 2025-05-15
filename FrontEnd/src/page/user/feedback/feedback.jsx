import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/navbar/navbar';
import Footer from '../../../components/footer/footer';
import './feedback.css';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    guideName: '',
    rating: 0,
    guideExperience: '',
    semenggohExperience: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [guides, setGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);

  // Fetch guides from the backend
  useEffect(() => {
    const fetchGuides = async () => {
      setLoadingGuides(true);
      try {
        const response = await fetch('http://localhost:3000/api/guides');
        if (response.ok) {
          const data = await response.json();
          setGuides(data);
        } else {
          console.error('Failed to fetch guides');
        }
      } catch (error) {
        console.error('Error fetching guides:', error);
      } finally {
        setLoadingGuides(false);
      }
    };

    fetchGuides();
  }, []);

  // Animation on scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if (elementPosition < screenPosition) {
          element.classList.add('visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Timer to hide success message after 2.5 seconds
  useEffect(() => {
    let timer;
    if (submitted) {
      timer = setTimeout(() => {
        setSubmitted(false);
      }, 2500);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [submitted]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.guideName.trim()) newErrors.guideName = 'Park guide name is required';
    if (formData.rating === 0) newErrors.rating = 'Please rate your park guide';
    if (!formData.guideExperience.trim()) newErrors.guideExperience = 'Guide experience is required';
    if (!formData.semenggohExperience.trim()) newErrors.semenggohExperience = 'Semenggoh experience is required';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const handleRating = (value) => {
    setFormData(prev => ({ ...prev, rating: value }));
    setErrors(prev => ({ ...prev, rating: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // Call the API to submit feedback using fetch instead of axios
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          guide_name: formData.guideName,
          rating: formData.rating,
          guide_experience: formData.guideExperience,
          semenggoh_experience: formData.semenggohExperience
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          guideName: '',
          rating: 0,
          guideExperience: '',
          semenggohExperience: '',
        });
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Focus on the first input for better UX
        document.getElementById('name')?.focus();
      } else {
        setApiError(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setApiError('An error occurred while submitting your feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      {/* Apply Navbar */}
      <Navbar />
      
      {/* Hero Section */}
      <section className="feedback-hero">
        <div className="feedback-hero-content">
          <h1>Share Your Experience</h1>
          <p>Your feedback helps us improve our services and ensure a better experience for all visitors.</p>
        </div>
      </section>

      {/* Success Message - Moved outside the container for better visibility */}
      {submitted && (
        <div className="success-message-wrapper">
          <div className="success-message-full">
            <i className="fas fa-check-circle"></i>
            <p>Thank you for your feedback! Your input is valuable to us.</p>
          </div>
        </div>
      )}
      
      <div className="feedback-container animate-on-scroll">
        <h2>Semenggoh Feedback Form</h2>
        
        <div className="form-introduction">
          <p>Please share your thoughts about your visit and your experience with our park guide. Your feedback is essential to help us improve our services.</p>
          <p>All fields marked with <span className="required-indicator">*</span> are required.</p>
        </div>
        
        {apiError && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{apiError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate className="feedback-form">
          <InputField 
            label="Your Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            error={errors.name} 
            icon="user"
            disabled={loading}
          />
          
          <InputField 
            label="Your Email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            error={errors.email} 
            icon="envelope"
            disabled={loading}
          />
          
          <div className="form-group">
            <label htmlFor="guideName">
              <i className="fas fa-id-badge"></i> Park Guide's Name<span className="required-indicator">*</span>
            </label>
            <select
              id="guideName"
              name="guideName"
              value={formData.guideName}
              onChange={handleChange}
              className={errors.guideName ? 'error-input' : ''}
              disabled={loading || loadingGuides}
            >
              <option value="">-- Select a Guide --</option>
              {loadingGuides ? (
                <option value="" disabled>Loading guides...</option>
              ) : (
                guides.map((guide) => (
                  <option key={guide.id} value={guide.name}>
                    {guide.name}
                  </option>
                ))
              )}
            </select>
            {errors.guideName && <span className="error">{errors.guideName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="rating">
              <i className="fas fa-star"></i> Park Guide Rating<span className="required-indicator">*</span>
            </label>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  onClick={() => !loading && handleRating(star)}
                  className={`star ${formData.rating >= star ? 'active' : ''} ${loading ? 'disabled' : ''}`}
                >★</span>
              ))}
            </div>
            {errors.rating && <span className="error">{errors.rating}</span>}
          </div>

          <TextAreaField
            label="Experience with the Park Guide"
            name="guideExperience"
            value={formData.guideExperience}
            onChange={handleChange}
            error={errors.guideExperience}
            icon="user-shield"
            disabled={loading}
          />

          <TextAreaField
            label="Your Experience at Semenggoh"
            name="semenggohExperience"
            value={formData.semenggohExperience}
            onChange={handleChange}
            error={errors.semenggohExperience}
            icon="tree"
            disabled={loading}
          />

          <div className="data-policy">
            <p>By submitting this form, you agree that your feedback may be used to improve our services. Your personal information will be handled according to our privacy policy.</p>
          </div>

          <button 
            type="submit" 
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
      
      {/* Information Section */}
      <section className="feedback-info animate-on-scroll">
        <div className="info-card">
          <i className="fas fa-comment-dots"></i>
          <h3>Why Your Feedback Matters</h3>
          <p>Your honest feedback helps us improve our park guide services and enhance the overall experience for future visitors.</p>
        </div>
        <div className="info-card">
          <i className="fas fa-clipboard-check"></i>
          <h3>What We Do With Your Feedback</h3>
          <p>We carefully review all feedback to identify areas of improvement and recognize outstanding park guides.</p>
        </div>
        <div className="info-card">
          <i className="fas fa-heart"></i>
          <h3>Thank You</h3>
          <p>We appreciate you taking the time to share your thoughts. Your input is invaluable to our continuous improvement.</p>
        </div>
      </section>
      
      {/* Link back to homepage */}
      <div className="back-link animate-on-scroll">
        <a href="/" className="btn">
          <i className="fas fa-arrow-left"></i> Back to Homepage
        </a>
      </div>
      
      {/* Add Footer Component */}
      <Footer />
      
      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

// Reusable Components
const InputField = ({ label, name, value, onChange, error, type = "text", icon, disabled }) => (
  <div className="form-group">
    <label htmlFor={name}>
      {icon && <i className={`fas fa-${icon}`}></i>} {label}<span className="required-indicator">*</span>
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      className={error ? 'error-input' : ''}
      disabled={disabled}
    />
    {error && <span className="error">{error}</span>}
  </div>
);

const TextAreaField = ({ label, name, value, onChange, error, icon, disabled }) => (
  <div className="form-group">
    <label htmlFor={name}>
      {icon && <i className={`fas fa-${icon}`}></i>} {label}<span className="required-indicator">*</span>
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      rows="4"
      className={error ? 'error-input' : ''}
      disabled={disabled}
    />
    {error && <span className="error">{error}</span>}
  </div>
);

export default FeedbackForm;