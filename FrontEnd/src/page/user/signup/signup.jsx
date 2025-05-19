import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signup.css';
// Import Font Awesome components
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faHome, faArrowRight, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Send registration request using fetch
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessMessage('Registration successful! Redirecting to login page...');
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Registration failed, please try again later');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage('Registration failed, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-content">
          <div className="signup-image-container">
            <div className="signup-image"></div>
            <div className="signup-overlay">
              <h2>Join ParkGuide Today</h2>
              <p>Create an account to explore nature's wonders with our expert guides.</p>
            </div>
          </div>
          
          <div className="signup-form-container">
            <a href="/" className="home-button">
              <FontAwesomeIcon icon={faHome} /> Home
            </a>
            
            <div className="signup-form-wrapper">
              <h1>Create Account</h1>
              <p className="signup-subtitle">Fill in the details below to sign up</p>
              
              {successMessage && (
                <div className="message success">
                  <FontAwesomeIcon icon={faCheck} /> {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="message error">
                  {errorMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-with-icon">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      className={errors.username ? 'error' : ''}
                    />
                    <FontAwesomeIcon icon={faUser} className="input-icon" />
                  </div>
                  {errors.username && <div className="error-message">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={errors.email ? 'error' : ''}
                    />
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  </div>
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Choose a password"
                      className={errors.password ? 'error' : ''}
                    />
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                  </div>
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-with-icon">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                  </div>
                  {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                </div>

                <div className="form-group terms-group">
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={formData.terms}
                      onChange={handleChange}
                    />
                    <label htmlFor="terms">I have read and agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></label>
                  </div>
                  {errors.terms && <div className="error-message">{errors.terms}</div>}
                </div>

                <button 
                  type="submit" 
                  className="signup-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>Processing... <FontAwesomeIcon icon={faSpinner} spin /></span>
                  ) : (
                    <span>Sign Up <FontAwesomeIcon icon={faArrowRight} /></span>
                  )}
                </button>
              </form>
              
              <div className="signin-prompt">
                <p>Already have an account? <Link to="/signin">Sign In</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
