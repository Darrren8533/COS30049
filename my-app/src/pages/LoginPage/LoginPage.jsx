import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

function LoginPage({ onUserStateChange }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Send guide login request to backend
      const response = await axios.post('http://localhost:3000/api/guide/login', formData)
      
      if (response.data.success) {
        // Login successful
        const userData = {
          ...response.data.user,
          role: 'guide'  // Ensure guide role is stored
        }
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Trigger user state change event
        window.dispatchEvent(new Event('userStateChanged'))
        
        // If callback is provided, call it
        if (onUserStateChange) {
          onUserStateChange()
        }
        
        navigate('/guide-dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(
        error.response?.data?.message || 
        'Login failed. Please check your email and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="guide-login-page">
      <div className="guide-login-container">
        <div className="guide-login-header">
          <h1>Guide Login</h1>
          <p>Welcome back, please login to your guide account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="guide-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="guide-login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-note">
          <p>Don't have an account? Please contact an administrator to create a guide account.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 