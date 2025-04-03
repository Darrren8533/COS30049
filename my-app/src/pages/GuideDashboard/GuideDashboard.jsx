import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './GuideDashboard.css'

function GuideDashboard() {
  const [guide, setGuide] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')
  
  const navigate = useNavigate()
  
  // Check if user is a guide
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/login')
      return
    }
    
    const user = JSON.parse(storedUser)
    if (user.role !== 'guide') {
      navigate('/')
      return
    }
    
    setGuide(user)
    
    // Fetch guide schedules
    fetchSchedules()
  }, [navigate])
  
  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3000/api/guide/schedules', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      })
      
      if (response.data.success) {
        setSchedules(response.data.schedules)
      } else {
        setError('Failed to fetch schedules')
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setError('Unable to fetch schedules. Please check your network connection.')
    } finally {
      setLoading(false)
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
  
  // Filter schedules
  const filteredSchedules = () => {
    if (!schedules.length) return []
    
    const now = new Date()
    
    if (activeTab === 'upcoming') {
      return schedules.filter(schedule => new Date(schedule.date) >= now)
    } else if (activeTab === 'past') {
      return schedules.filter(schedule => new Date(schedule.date) < now)
    }
    
    return schedules
  }
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }
  
  return (
    <div className="guide-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Guide Dashboard</h1>
        <div className="guide-info">
          {guide && (
            <div className="guide-header-info">
              <span>Welcome, {guide.username}</span>
              <button onClick={handleLogout} className="logout-btn-dash">Logout</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="guide-profile-card">
        <div className="guide-profile-header">
          <div className="guide-avatar">
            {guide && guide.username.charAt(0).toUpperCase()}
          </div>
          <div className="guide-details">
            <h2>{guide?.username}</h2>
            <p>{guide?.email}</p>
            <p className="guide-id">Guide ID: {guide?.id}</p>
          </div>
        </div>
        
        <div className="guide-stats">
          <div className="stat-item">
            <span className="stat-value">{filteredSchedules().length}</span>
            <span className="stat-label">Upcoming Tours</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{schedules.filter(s => new Date(s.date) < new Date()).length}</span>
            <span className="stat-label">Completed Tours</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {schedules.reduce((total, schedule) => total + (schedule.visitors || 0), 0)}
            </span>
            <span className="stat-label">Total Visitors</span>
          </div>
        </div>
      </div>
      
      <div className="schedule-section">
        <div className="schedule-header">
          <h2>Schedule</h2>
          <div className="schedule-tabs">
            <button 
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Tours
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading-message">Loading schedules...</div>
        ) : (
          <>
            {filteredSchedules().length === 0 ? (
              <div className="no-schedules">
                <p>No {activeTab === 'upcoming' ? 'upcoming' : 'past'} schedules available</p>
              </div>
            ) : (
              <div className="schedule-cards">
                {filteredSchedules().map(schedule => (
                  <div key={schedule.id} className="schedule-card">
                    <div className="schedule-date">{formatDate(schedule.date)}</div>
                    <h3 className="schedule-route">{schedule.route_name}</h3>
                    <div className="schedule-details">
                      <p><span className="detail-label">Visitors:</span> {schedule.visitors}</p>
                      <p><span className="detail-label">Meeting Point:</span> {schedule.meeting_point}</p>
                      <p><span className="detail-label">Duration:</span> {schedule.duration} hours</p>
                    </div>
                    <div className="schedule-description">
                      <p>{schedule.description}</p>
                    </div>
                    <div className="schedule-actions">
                      <button className="view-details-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default GuideDashboard 