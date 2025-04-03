import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './HomePage.css'

function HomePage({ onUserStateChange }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      
      // If callback is provided, call it
      if (onUserStateChange) {
        onUserStateChange()
      }
    }
  }, [onUserStateChange])

  return (
    <>
      <div className="home-page" style={{ marginBottom: 0, paddingBottom: 0 }}>
        <div className="hero-section">
          <h1>Park Guide Management System</h1>
          <p className="hero-subtitle">Professional guide services and management platform for parks</p>
          
          {user ? (
            <div className="welcome-user">
              <p>Welcome back, <span className="user-name">{user.username}</span></p>
              {user.role === 'admin' && (
                <Link to="/admin-dashboard" className="btn btn-primary">Enter Admin Panel</Link>
              )}
              {user.role === 'guide' && (
                <Link to="/guide-dashboard" className="btn btn-primary">Enter Guide Dashboard</Link>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-primary">Guide Login</Link>
              <Link to="/admin-login" className="btn btn-outline">Admin Login</Link>
            </div>
          )}
        </div>
        
        <div className="features-section">
          <div className="card feature-card">
            <h3>Guide Management</h3>
            <p>Administrators can register and supervise guide accounts to ensure service quality.</p>
          </div>
          
          <div className="card feature-card">
            <h3>Schedule Planning</h3>
            <p>Guides can view their schedules and understand service content and timings.</p>
          </div>
          
          <div className="card feature-card">
            <h3>Visitor Services</h3>
            <p>Provide excellent guidance services for the best park tour experience.</p>
          </div>
        </div>
        
        <div className="system-workflow">
          <h2>System Workflow</h2>
          <div className="workflow-container">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Admin Login</h3>
                <p>Administrators log in through the dedicated portal</p>
              </div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Register Guide Accounts</h3>
                <p>Administrators create accounts and set permissions for guides</p>
              </div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Guide Login</h3>
                <p>Guides use admin-created accounts to log in</p>
              </div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Begin Guide Work</h3>
                <p>Guides check schedules and provide services</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: 0 }}>
        <div className="footer-container">
          <div className="footer-column">
            <h3 className="footer-logo">Park Guide System</h3>
            <p className="footer-description">
              We are dedicated to providing professional guide services and management platforms for parks, bringing visitors a better touring experience.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon">Fb</a>
              <a href="#" className="social-icon">Tw</a>
              <a href="#" className="social-icon">In</a>
            </div>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/login">Guide Login</Link></li>
              <li><Link to="/admin-login">Admin Login</Link></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-title">Guide Services</h3>
            <ul className="footer-links">
              <li><a href="#">Natural Scenery Tours</a></li>
              <li><a href="#">Historical & Cultural Explanations</a></li>
              <li><a href="#">Featured Route Recommendations</a></li>
              <li><a href="#">Group Customized Services</a></li>
              <li><a href="#">VIP Exclusive Guides</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-title">Contact Us</h3>
            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <span>88 Park Road, Chaoyang District, Beijing, China</span>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <span>+86 10 8888 8888</span>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">✉️</span>
              <span>contact@parkguide.com</span>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Park Guide Management System. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  )
}

export default HomePage 