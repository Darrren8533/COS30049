import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    setSuccess('')
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)

    try {
      // Send registration request to backend
      const response = await axios.post('http://localhost:3000/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      
      if (response.data.success) {
        // Registration successful
        setSuccess(response.data.message || 'Registration successful!')
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError(
        error.response?.data?.message || 
        'Registration failed, please try again later'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <h1>User Registration</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {success && <div className="success-message">
        {success} <span className="redirect-info">Redirecting to login page in 3 seconds...</span>
      </div>}
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
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
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={loading || success}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default RegisterPage 