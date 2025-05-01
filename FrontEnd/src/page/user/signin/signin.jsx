import React, { useState } from 'react';
import './signin.css';
// 引入Font Awesome组件
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faHome, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: '', text: '' });
  
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
  
  const validateForm = () => {
    const errors = {};
    
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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsLoading(true);
        setLoginMessage({ type: '', text: '' });
        
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
          // 登录成功
          setLoginMessage({ 
            type: 'success', 
            text: 'Login successful! Redirecting...' 
          });
          
          // 如果选择了"记住我"，可以在localStorage中存储相关信息
          if (formData.rememberMe) {
            localStorage.setItem('userEmail', formData.email);
          } else {
            localStorage.removeItem('userEmail');
          }
          
          // 存储用户信息
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // 重定向到首页或仪表板（3秒后）
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          // 登录失败
          setLoginMessage({ 
            type: 'error', 
            text: data.message || 'Login failed. Please try again.' 
          });
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
              <h1>Sign In</h1>
              <p className="signin-subtitle">Enter your credentials to access your account</p>
              
              {loginMessage.text && (
                <div className={`message ${loginMessage.type}`}>
                  {loginMessage.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="signin-form">
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
                  </div>
                  {formErrors.email && <div className="error-message">{formErrors.email}</div>}
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
                      placeholder="Your password"
                      className={formErrors.password ? 'error' : ''}
                    />
                  </div>
                  {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                </div>
                
                <div className="form-options">
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <label htmlFor="rememberMe">Remember me</label>
                  </div>
                  <a href="/forgot-password" className="forgot-password">Forgot password?</a>
                </div>
                
                <button 
                  type="submit" 
                  className="signin-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>Signing in... <FontAwesomeIcon icon={faSpinner} spin /></span>
                  ) : (
                    <span>Sign In <FontAwesomeIcon icon={faArrowRight} /></span>
                  )}
                </button>
              </form>
              
              {/* <div className="signin-divider">
                <span>OR</span>
              </div>
              
              <div className="social-signin">
                <button className="social-button google">
                  <FontAwesomeIcon icon={faGoogle} /> Sign in with Google
                </button>
                <button className="social-button facebook">
                  <FontAwesomeIcon icon={faFacebookF} /> Sign in with Facebook
                </button>
              </div> */}
              
              <div className="signup-prompt">
                <p>Don't have an account? <a href="/signup">Sign Up</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
