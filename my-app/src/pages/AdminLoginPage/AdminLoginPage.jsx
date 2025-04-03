import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './AdminLoginPage.css'

function AdminLoginPage({ onUserStateChange }) {
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
      // Send admin login request to backend
      const response = await axios.post('http://localhost:3000/api/admin/login', formData)
      
      if (response.data.success) {
        // Login successful
        const userData = {
          ...response.data.user,
          role: 'admin'  // Ensure admin role is stored
        }
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Trigger user state change event
        window.dispatchEvent(new Event('userStateChanged'))
        
        // If callback is provided, call it
        if (onUserStateChange) {
          onUserStateChange()
        }
        
        navigate('/admin-dashboard')
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
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>Administrator Login</h1>
          <p>Please use your administrator account to login to the system</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter admin email"
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
              placeholder="Enter password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="admin-login-btn">
            {loading ? 'Logging in...' : 'Admin Login'}
          </button>
        </form>
      </div>

      <div className="admin-info">
        <h3>Administrator Features</h3>
        <ul>
          <li>Create and manage guide accounts</li>
          <li>Schedule guide work plans</li>
          <li>View system operations</li>
          <li>Manage park information</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminLoginPage 