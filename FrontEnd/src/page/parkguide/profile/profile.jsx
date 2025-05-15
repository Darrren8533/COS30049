import React, { useState, useEffect } from 'react';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './profile.css';

const Profile = () => {
  const [activeLink, setActiveLink] = useState('profile');
  const [user, setUser] = useState({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    bio: '',
    experience: '',
    specializations: [],
    certifications: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // get user id
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;

  // get user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          const userData = {
            username: data.user.username || '',
            email: data.user.email || '',
            fullName: data.user.fullName || '',
            phoneNumber: data.user.phoneNumber || '',
            bio: data.user.bio || '',
            experience: data.user.experience || '',
            specializations: data.user.specializations || [],
            certifications: data.user.certifications || []
          };
          
          setUser(userData);
          setEditedUser(userData);
        } else {
          setError(data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to connect to the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  // handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser(user); // when cancel, reset to original data
    }
    setIsEditing(!isEditing);
  };

  // handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };

  // handle multiple choice value change
  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setEditedUser({
        ...editedUser,
        specializations: [...editedUser.specializations, value]
      });
    } else {
      setEditedUser({
        ...editedUser,
        specializations: editedUser.specializations.filter(spec => spec !== value)
      });
    }
  };

  // save personal information
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedUser)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(editedUser);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        
        // 3 seconds later, clear success message
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;
    
    return (
      <div className="success-message">
        <i className="icon fa-solid fa-check-circle"></i>
        <span>{successMessage}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} />
      
      <div className="main-content">
        {/* Success message */}
        {renderSuccessMessage()}
        
        <div className="profile-header">
          <div className="profile-title">
            <h1>My Profile</h1>
            <p>Manage your personal information and preferences</p>
          </div>
          
          <div className="profile-actions">
            <button 
              className={`btn-edit-profile ${isEditing ? 'active' : ''}`} 
              onClick={handleEditToggle}
            >
              <i className={`icon fa-solid ${isEditing ? 'fa-times' : 'fa-pen'}`}></i>
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
            
            {isEditing && (
              <button 
                className="btn-save-profile" 
                onClick={handleSaveProfile}
                disabled={loading}
              >
                <i className="icon fa-solid fa-save"></i>
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>

        {loading && !isEditing ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        ) : (
          <div className="profile-content">
            <div className="profile-section personal-info">
              <h2>Personal Information</h2>
              
              <div className="profile-grid">
                <div className="profile-field">
                  <label>Username</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="username" 
                      value={editedUser.username}
                      onChange={handleInputChange}
                      disabled={true} // Username is usually not allowed to be modified
                    />
                  ) : (
                    <p>{user.username}</p>
                  )}
                </div>
                
                <div className="profile-field">
                  <label>Email</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      name="email" 
                      value={editedUser.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{user.email}</p>
                  )}
                </div>
                
                <div className="profile-field">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="fullName" 
                      value={editedUser.fullName}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{user.fullName || 'Not specified'}</p>
                  )}
                </div>
                
                <div className="profile-field">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      name="phoneNumber" 
                      value={editedUser.phoneNumber}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{user.phoneNumber || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="profile-section professional-info">
              <h2>Professional Information</h2>
              
              <div className="profile-field full-width">
                <label>Bio</label>
                {isEditing ? (
                  <textarea 
                    name="bio" 
                    value={editedUser.bio}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Write a short bio about yourself..."
                  />
                ) : (
                  <p className="profile-bio">{user.bio || 'No bio information provided.'}</p>
                )}
              </div>
              
              <div className="profile-field full-width">
                <label>Experience</label>
                {isEditing ? (
                  <textarea 
                    name="experience" 
                    value={editedUser.experience}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe your experience as a park guide..."
                  />
                ) : (
                  <p>{user.experience || 'No experience information provided.'}</p>
                )}
              </div>
              
              {/* <div className="profile-field full-width">
                <label>Specializations</label>
                {isEditing ? (
                  <div className="specialization-checkboxes">
                    {['Wildlife', 'Botany', 'Geology', 'History', 'Conservation', 'Hiking', 'Camping'].map(spec => (
                      <label key={spec} className="checkbox-label">
                        <input 
                          type="checkbox" 
                          value={spec}
                          checked={editedUser.specializations.includes(spec)}
                          onChange={handleSpecializationChange}
                        />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="specialization-tags">
                    {user.specializations && user.specializations.length > 0 ? (
                      user.specializations.map(spec => (
                        <span key={spec} className="specialization-tag">{spec}</span>
                      ))
                    ) : (
                      <p>No specializations specified.</p>
                    )}
                  </div>
                )}
              </div> */}
            </div>
            
            <div className="profile-section certifications-section">
              <h2>My Certifications</h2>
              
              {user.certifications && user.certifications.length > 0 ? (
                <div className="certifications-list">
                  {user.certifications.map(cert => (
                    <div key={cert.id} className="certification-item">
                      <div className="certification-icon">
                        <i className="icon fa-solid fa-certificate"></i>
                      </div>
                      <div className="certification-details">
                        <h3>{cert.name}</h3>
                        <p className="certification-date">Issued: {cert.issueDate}</p>
                        <p className="certification-status">Status: <span className={`status-${cert.status.toLowerCase()}`}>{cert.status}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-certifications">
                  <p>You don't have any certifications yet. Start your certification journey!</p>
                  <button className="btn-browse-certifications" onClick={() => window.location.href = '/parkguide/certifications'}>
                    <i className="icon fa-solid fa-search"></i>
                    <span>Browse Certifications</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
