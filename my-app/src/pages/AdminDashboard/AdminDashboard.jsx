import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './AdminDashboard.css'

function AdminDashboard() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(null)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    experience: ''
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  
  const navigate = useNavigate()
  
  // Check if user is admin
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/admin-login')
      return
    }
    
    const user = JSON.parse(storedUser)
    if (user.role !== 'admin') {
      navigate('/')
      return
    }
    
    setAdmin(user)
    
    // Fetch all guides
    fetchGuides()
  }, [navigate])
  
  // Fetch all guides
  const fetchGuides = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3000/api/admin/guides', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      })
      
      if (response.data.success) {
        setGuides(response.data.guides)
      } else {
        setError('Failed to retrieve guides list')
      }
    } catch (error) {
      console.error('Error fetching guides list:', error)
      setError('Unable to fetch guides list, please check your network connection')
    } finally {
      setLoading(false)
    }
  }
  
  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  // Register new guide
  const handleRegisterGuide = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }
    
    try {
      const response = await axios.post('http://localhost:3000/api/admin/register-guide', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        experience: formData.experience
      }, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      })
      
      if (response.data.success) {
        setFormSuccess('Guide account created successfully!')
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          bio: '',
          experience: ''
        })
        // Refresh guides list
        fetchGuides()
        // Close form after 3 seconds
        setTimeout(() => {
          setShowRegisterForm(false)
          setFormSuccess('')
        }, 3000)
      } else {
        setFormError(response.data.message || 'Failed to create guide account')
      }
    } catch (error) {
      console.error('Error creating guide account:', error)
      setFormError(
        error.response?.data?.message || 
        'Failed to create guide account, please try again later'
      )
    }
  }
  
  // Logout
  const handleLogout = async () => {
    try {
      // Call backend logout API
      await axios.post('http://localhost:3000/api/logout');
      
      // Clear local storage
      localStorage.removeItem('user');
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('user');
      navigate('/');
    }
  };
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Control Panel</h1>
        <div className="admin-info">
          {admin && (
            <div className="admin-header-info">
              <span>Welcome, {admin.username}</span>
              <button onClick={handleLogout} className="logout-btn-dash">Logout</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-cards">
        <div className="dashboard-card guides-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title">Guide Management</h2>
            <button 
              className="add-guide-btn"
              onClick={() => setShowRegisterForm(!showRegisterForm)}
            >
              {showRegisterForm ? 'Cancel' : 'Add Guide'}
            </button>
          </div>
          
          {showRegisterForm && (
            <div className="register-guide-form">
              <h3>Register New Guide Account</h3>
              
              {formError && <div className="error-message">{formError}</div>}
              {formSuccess && <div className="success-message">{formSuccess}</div>}
              
              <form onSubmit={handleRegisterGuide}>
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
                
                <div className="form-row">
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
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Biography</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="experience">Work Experience</label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
                
                <button type="submit" className="submit-btn">Create Guide Account</button>
              </form>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-message">Loading guides list...</div>
          ) : (
            <>
              {guides.length === 0 ? (
                <p className="no-guides">No guides available. Please add guide accounts.</p>
              ) : (
                <table className="guides-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registration Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guides.map(guide => (
                      <tr key={guide.id}>
                        <td>{guide.id}</td>
                        <td>{guide.username}</td>
                        <td>{guide.email}</td>
                        <td>{new Date(guide.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`status ${guide.active ? 'active' : 'inactive'}`}>
                            {guide.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="edit-btn">Edit</button>
                          <button className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard