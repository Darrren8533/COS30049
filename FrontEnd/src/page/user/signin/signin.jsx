import React, { useState } from 'react';
import './signin.css';
// Import Font Awesome components
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faHome, faArrowRight, faSpinner, faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    otp: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear the error message for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!showOtpForm) {
      // Validate email and password fields
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email address is invalid';
      }
      
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    } else {
      // Validate OTP field
      if (!formData.otp) {
        errors.otp = 'Verification code is required';
      } else if (formData.otp.length !== 6 || !/^\d+$/.test(formData.otp)) {
        errors.otp = 'Verification code must be 6 digits';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsLoading(true);
        setLoginMessage({ type: '', text: '' });
        
        if (!showOtpForm) {
          // First step: Email and password verification
          const response = await fetch('http://localhost:3000/api/signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            if (data.requiresOTP) {
              // Need OTP verification
              setShowOtpForm(true);
              setVerificationEmail(data.email);
              setLoginMessage({ 
                type: 'success', 
                text: 'Verification code sent to your email. Please check your inbox and enter the code.' 
              });
            } else {
              // Direct login without OTP (fallback for backward compatibility)
              handleLoginSuccess(data);
            }
          } else {
            // Login failed
            setLoginMessage({ 
              type: 'error', 
              text: data.message || 'Login failed. Please try again.' 
            });
          }
        } else {
          // Second step: OTP verification
          const response = await fetch('http://localhost:3000/api/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: verificationEmail,
              otp: formData.otp
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // OTP verification successful
            handleLoginSuccess(data);
          } else {
            // OTP verification failed
            setLoginMessage({ 
              type: 'error', 
              text: data.message || 'Verification failed. Please try again.' 
            });
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        setLoginMessage({ 
          type: 'error', 
          text: 'Network error. Please try again later.' 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleLoginSuccess = (data) => {
    setLoginMessage({ 
      type: 'success', 
      text: 'Login successful! Redirecting...' 
    });
    
    // If "remember me" is selected, store relevant information in localStorage
    if (formData.rememberMe) {
      localStorage.setItem('userEmail', formData.email);
    } else {
      localStorage.removeItem('userEmail');
    }
    
    // Store user information
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on user role
    setTimeout(() => {
      const userRole = data.user.userRole.toLowerCase();
      
      if (userRole === 'admin') {
        // Admin goes to admin dashboard
        window.location.href = '/admin/dashboard';
      } else if (userRole === 'guide' || userRole === 'parkguide') {
        // Guide goes to guide dashboard
        window.location.href = '/parkguide/dashboard';
      } else {
        // Default to home page for visitors or other roles
        window.location.href = '/';
      }
    }, 1500);
  };
  
  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      setLoginMessage({ type: '', text: '' });
      
      const response = await fetch('http://localhost:3000/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationEmail,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.requiresOTP) {
        setLoginMessage({ 
          type: 'success', 
          text: 'New verification code sent to your email' 
        });
      } else {
        setLoginMessage({ 
          type: 'error', 
          text: data.message || 'Failed to resend code. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setLoginMessage({ 
        type: 'error', 
        text: 'Network error. Please try again later.' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    setShowOtpForm(false);
    setVerificationEmail('');
    setFormData({
      ...formData,
      otp: ''
    });
    setLoginMessage({ type: '', text: '' });
  };
  
  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-content">
          <div className="signin-image-container">
            <div className="signin-image"></div>
            <div className="signin-overlay">
              <h2>Welcome Back to ParkGuide</h2>
              <p>Continue your journey through nature's wonders with expert guides.</p>
            </div>
          </div>
          
          <div className="signin-form-container">
            <a href="/" className="home-button">
              <FontAwesomeIcon icon={faHome} /> Home
            </a>
            
            <div className="signin-form-wrapper">
              <h1>{showOtpForm ? 'Verify Your Login' : 'Sign In'}</h1>
              <p className="signin-subtitle">
                {showOtpForm 
                  ? `Enter the verification code sent to ${verificationEmail}` 
                  : 'Enter your credentials to access your account'}
              </p>
              
              {loginMessage.text && (
                <div className={`message ${loginMessage.type}`}>
                  {loginMessage.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="signin-form">
                {!showOtpForm ? (
                  <>
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
                          className={formErrors.email ? 'error' : ''}
                        />
                        {/* <FontAwesomeIcon icon={faEnvelope} className="input-icon left-icon" /> */}
                      </div>
                      {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-with-icon">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Your password"
                          className={formErrors.password ? 'error' : ''}
                        />
                        {/* <FontAwesomeIcon 
                          icon={faLock} 
                          className="input-icon left-icon" 
                        /> */}
                        <button 
                          type="button"
                          className="password-toggle"
                          onClick={togglePasswordVisibility}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <FontAwesomeIcon 
                            icon={showPassword ? faEyeSlash : faEye} 
                            className="input-icon right-icon" 
                          />
                        </button>
                      </div>
                      {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                    </div>
                    
                    <div className="form-group remember-me-container">
                      {/* <div className="remember-me">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                        />
                        <label htmlFor="rememberMe">Remember me</label>
                      </div>
                      <a href="/forgot-password" className="forgot-password">
                        Forgot Password?
                      </a> */}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="otp">Verification Code</label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          value={formData.otp}
                          onChange={handleChange}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className={formErrors.otp ? 'error' : ''}
                        />
                        <FontAwesomeIcon icon={faKey} className="input-icon left-icon" />
                      </div>
                      {formErrors.otp && <div className="error-message">{formErrors.otp}</div>}
                    </div>
                    
                    <div className="form-group otp-options">
                      <button 
                        type="button" 
                        className="resend-otp"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                      >
                        Resend Code
                      </button>
                      <button 
                        type="button" 
                        className="back-to-login"
                        onClick={handleBackToLogin}
                        disabled={isLoading}
                      >
                        Back to Login
                      </button>
                    </div>
                  </>
                )}
                
                <button 
                  type="submit" 
                  className="signin-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>
                      {showOtpForm ? 'Verifying...' : 'Signing in...'} 
                      <FontAwesomeIcon icon={faSpinner} spin />
                    </span>
                  ) : (
                    <span>
                      {showOtpForm ? 'Verify' : 'Sign In'} 
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  )}
                </button>
              </form>
              
              {/* {!showOtpForm && (
                <div className="signup-prompt">
                  <p>Don't have an account? <a href="/signup">Sign Up</a></p>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
