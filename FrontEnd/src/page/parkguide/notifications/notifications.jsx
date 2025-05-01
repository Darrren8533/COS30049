import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './notifications.css';

const Notifications = () => {
  const [activeLink, setActiveLink] = useState('notifications');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readStatus, setReadStatus] = useState({});
  
  // New state for message sending
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedRecipientName, setSelectedRecipientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecipientResults, setShowRecipientResults] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState(null);
  
  // Notification detail modal state
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Ref for recipient search container
  const recipientSearchRef = React.useRef(null);
  
  const navigate = useNavigate();
  
  // Get user information
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.userId;
  
  // In a real application, this function would make an API request to get notification data
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      
      try {
        // Real API call to fetch notifications
        const response = await fetch(`http://localhost:3000/api/notifications/${userId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map the received data to match our frontend model
        const formattedNotifications = data.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          date: notification.date,
          read: notification.is_read,
          fromUserId: notification.from_user_id,
          toUserId: notification.to_user_id
        }));
        
        setNotifications(formattedNotifications);
        
        // Extract read status for localStorage
        const newReadStatus = {};
        formattedNotifications.forEach(notification => {
          if (notification.read) {
            newReadStatus[notification.id] = true;
          }
        });
        
        setReadStatus(newReadStatus);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('An error occurred while fetching notifications. Please try again later.');
        
        // Fallback to mock data in case of API failure for development
        const mockNotifications = [
          {
            id: 1,
            type: 'unread',
            title: 'Certification application approved',
            message: 'Your "Wildlife Guide Certification" application has been approved. You can now start studying the related materials.',
            date: '2023-12-18T09:30:00',
            read: false,
            fromUserId: 3,
            toUserId: userId
          },
          {
            id: 2,
            type: 'read',
            title: 'New policy released',
            message: 'The park management department has released a new guide safety guide. All guides are requested to read and comply.',
            date: '2023-12-17T14:45:00',
            read: true,
            fromUserId: 3,
            toUserId: userId
          },
          {
            id: 3,
            type: 'unread',
            title: 'Certification materials updated',
            message: 'The study materials for the "First Aid and Safety" certification have been updated. Please check the latest content.',
            date: '2023-12-15T10:15:00',
            read: false,
            fromUserId: 3,
            toUserId: userId
          }
        ];
        
        setNotifications(mockNotifications);
        
        // Extract read status for localStorage
        const fallbackReadStatus = {};
        mockNotifications.forEach(notification => {
          if (notification.read) {
            fallbackReadStatus[notification.id] = true;
          }
        });
        
        setReadStatus(fallbackReadStatus);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [userId]);
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Show notification detail
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    
    // Only mark as read if it's a received unread notification
    if (notification.type === 'unread') {
      markAsRead(notification.id);
    }
  };
  
  // Close notification detail modal
  const closeNotificationDetail = () => {
    setShowNotificationDetail(false);
    setSelectedNotification(null);
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Find notification type before updating
      const notification = notifications.find(n => n.id === notificationId);
      
      // Only proceed if it's an unread notification
      if (!notification || notification.type !== 'unread') {
        return;
      }
      
      // API call to mark notification as read
      const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const updatedReadStatus = {
        ...readStatus,
        [notificationId]: true
      };
      
      setReadStatus(updatedReadStatus);
      
      // Update read status in the notification list
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true, type: 'read' } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      // Save to localStorage as a backup
      localStorage.setItem('notificationReadStatus', JSON.stringify(updatedReadStatus));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Continue with local update even if API fails
      const updatedReadStatus = {
        ...readStatus,
        [notificationId]: true
      };
      
      setReadStatus(updatedReadStatus);
      
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true, type: 'read' } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      localStorage.setItem('notificationReadStatus', JSON.stringify(updatedReadStatus));
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // API call to mark all notifications as read
      const response = await fetch(`http://localhost:3000/api/notifications/markAllRead`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const updatedReadStatus = { ...readStatus };
      
      notifications.forEach(notification => {
        updatedReadStatus[notification.id] = true;
      });
      
      setReadStatus(updatedReadStatus);
      
      // Update read status in the notification list
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        type: notification.type === 'unread' ? 'read' : notification.type
      }));
      
      setNotifications(updatedNotifications);
      
      // Save to localStorage as a backup
      localStorage.setItem('notificationReadStatus', JSON.stringify(updatedReadStatus));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Continue with local update even if API fails
      const updatedReadStatus = { ...readStatus };
      
      notifications.forEach(notification => {
        updatedReadStatus[notification.id] = true;
      });
      
      setReadStatus(updatedReadStatus);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        type: notification.type === 'unread' ? 'read' : notification.type
      }));
      
      setNotifications(updatedNotifications);
      localStorage.setItem('notificationReadStatus', JSON.stringify(updatedReadStatus));
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Show "x hours ago" within 1 day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return hours === 0 ? 'Just now' : `${hours} hours ago`;
    }
    
    // Show "x days ago" within 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} days ago`;
    }
    
    // Show date in other cases
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get notification icon and color based on notification type
  const getNotificationIcon = (notification) => {
    if (notification.type === 'sent') {
      return { icon: 'fa-paper-plane', color: '#059669' }; // Sent icon - Green
    } else {
      return { icon: 'fa-inbox', color: '#0EA5E9' }; // Receive (read/unread) icon - Blue
    }
  };
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.type === 'unread';
    if (activeTab === 'sent') return notification.type === 'sent';
    return notification.type === activeTab;
  });
  
  // Unread notification count
  const unreadCount = notifications.filter(notification => notification.type === 'unread').length;
  
  // Sent notification count
  const sentCount = notifications.filter(notification => notification.type === 'sent').length;
  
  // Fetch users for recipient selection
  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/users?currentUserId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecipients(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setMessageError('Failed to load users. Please try again later.');
    }
  };
  
  // Show send message modal
  const openSendMessage = () => {
    setShowSendMessage(true);
    fetchUsers();
    setMessageTitle('');
    setMessageContent('');
    setSelectedRecipient('');
    setSelectedRecipientName('');
    setSearchTerm('');
    setMessageError(null);
    setMessageSent(false);
  };
  
  // Close send message modal
  const closeSendMessage = () => {
    setShowSendMessage(false);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    // Validate inputs
    if (!selectedRecipient) {
      setMessageError('Please select a recipient');
      return;
    }
    
    if (!messageTitle.trim()) {
      setMessageError('Please enter a message title');
      return;
    }
    
    if (!messageContent.trim()) {
      setMessageError('Please enter a message');
      return;
    }
    
    setSendingMessage(true);
    setMessageError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_user_id: userId,
          to_user_id: selectedRecipient,
          title: messageTitle,
          message: messageContent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Message sent:', data);
      
      // Update local notifications to include the sent message
      const sentNotification = {
        id: data.sentNotificationId,
        type: 'sent',
        title: messageTitle,
        message: messageContent,
        date: new Date().toISOString(),
        read: true,
        fromUserId: userId,
        toUserId: selectedRecipient
      };
      
      setNotifications([sentNotification, ...notifications]);
      setMessageSent(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setShowSendMessage(false);
        setMessageSent(false);
        setMessageTitle('');
        setMessageContent('');
        setSelectedRecipient('');
        setSelectedRecipientName('');
        setSearchTerm('');
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageError('Failed to send message. Please try again later.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Handle recipient search and selection
  const handleRecipientSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowRecipientResults(value.trim().length > 0);
    
    // Clear selected recipient if search field is cleared
    if (value.trim() === '') {
      setSelectedRecipient('');
      setSelectedRecipientName('');
    }
  };
  
  // Select a recipient from search results
  const selectRecipient = (userId, username) => {
    setSelectedRecipient(userId);
    setSelectedRecipientName(username);
    setSearchTerm(username);
    setShowRecipientResults(false);
  };
  
  // Filter recipients based on search term
  const filteredRecipients = recipients
    .filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userRole.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5); // Show only up to 5 results
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (recipientSearchRef.current && !recipientSearchRef.current.contains(event.target)) {
        setShowRecipientResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      
      <div className="main-content">
        <div className="notifications-header">
          <div className="notifications-title">
            <h1>Notification Center</h1>
            <p>View and manage all your notifications</p>
          </div>
          
          <div className="notifications-actions">
            <button className="send-message-btn" onClick={openSendMessage}>
              <i className="fa-solid fa-paper-plane"></i>
              <span>Send Message</span>
            </button>
            
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                <i className="fa-solid fa-check-double"></i>
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Notification Detail Modal */}
        {showNotificationDetail && selectedNotification && (
          <div className="notification-detail-backdrop" onClick={closeNotificationDetail}>
            <div className="notification-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="notification-detail-header">
                <h2>Notification Details</h2>
                <button className="close-modal-btn" onClick={closeNotificationDetail}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="notification-detail-body">
                <div className="notification-detail-title">
                  <h3>{selectedNotification.title}</h3>
                  <div className="notification-detail-meta">
                    <span className="notification-date">{formatDate(selectedNotification.date)}</span>
                    <span className={`notification-status ${selectedNotification.type}`}>
                      {selectedNotification.type === 'sent' ? 'Sent' : 
                       selectedNotification.type === 'read' ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>
                
                <div className="notification-detail-content">
                  <p>{selectedNotification.message}</p>
                </div>
                
                <div className="notification-detail-users">
                  {selectedNotification.type === 'sent' ? (
                    <div className="notification-detail-recipient">
                      <span className="label">To:</span>
                      <span className="value">ID: {selectedNotification.toUserId}</span>
                    </div>
                  ) : (
                    <div className="notification-detail-sender">
                      <span className="label">From:</span>
                      <span className="value">ID: {selectedNotification.fromUserId || 'System'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="notification-detail-footer">
                <button className="close-detail-btn" onClick={closeNotificationDetail}>
                  Close
                </button>
                {selectedNotification.type === 'unread' || selectedNotification.type === 'read' ? (
                  <button className="reply-btn" onClick={() => {
                    closeNotificationDetail();
                    openSendMessage();
                    // Pre-select the sender as recipient if this is a reply
                    if (selectedNotification.fromUserId) {
                      const sender = recipients.find(r => r.userId === selectedNotification.fromUserId);
                      if (sender) {
                        setSelectedRecipient(sender.userId);
                        setSelectedRecipientName(sender.username);
                        setSearchTerm(sender.username);
                      }
                    }
                    // Pre-fill the message title as 'Re: original title'
                    setMessageTitle(`Re: ${selectedNotification.title}`);
                  }}>
                    <i className="fa-solid fa-reply"></i>
                    Reply
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
        
        {/* Send Message Modal */}
        {showSendMessage && (
          <div className="message-modal-backdrop">
            <div className="message-modal">
              <div className="message-modal-header">
                <h2>Send New Message</h2>
                <button className="close-modal-btn" onClick={closeSendMessage}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <div className="message-modal-body">
                {messageSent ? (
                  <div className="message-success">
                    <i className="fa-solid fa-check-circle"></i>
                    <p>Message sent successfully!</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                    <div className="form-group">
                      <label htmlFor="recipient">Recipient</label>
                      <div className="recipient-search-container" ref={recipientSearchRef}>
                        <input 
                          type="text" 
                          id="recipient" 
                          value={searchTerm} 
                          onChange={handleRecipientSearch}
                          onFocus={() => searchTerm.trim() !== '' && setShowRecipientResults(true)}
                          placeholder="Search for a user..."
                          autoComplete="off"
                          disabled={sendingMessage}
                        />
                        
                        {showRecipientResults && filteredRecipients.length > 0 && (
                          <div className="recipient-results">
                            {filteredRecipients.map(user => (
                              <div 
                                key={user.userId} 
                                className="recipient-result-item"
                                onClick={() => selectRecipient(user.userId, user.username)}
                              >
                                <span className="recipient-name">{user.username}</span>
                                <span className="recipient-role">{user.userRole}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {showRecipientResults && filteredRecipients.length === 0 && (
                          <div className="recipient-results">
                            <div className="recipient-no-results">
                              No users found
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedRecipient && (
                        <div className="selected-recipient">
                          Selected: <strong>{selectedRecipientName}</strong>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="messageTitle">Title</label>
                      <input 
                        type="text" 
                        id="messageTitle" 
                        value={messageTitle}
                        onChange={(e) => setMessageTitle(e.target.value)}
                        placeholder="Enter message title"
                        disabled={sendingMessage}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="messageContent">Message</label>
                      <textarea 
                        id="messageContent" 
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                        rows={5}
                        disabled={sendingMessage}
                      ></textarea>
                    </div>
                    
                    {messageError && (
                      <div className="message-error">
                        <i className="fa-solid fa-exclamation-circle"></i>
                        <p>{messageError}</p>
                      </div>
                    )}
                    
                    <div className="modal-actions">
                      <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={closeSendMessage}
                        disabled={sendingMessage}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="send-btn"
                        disabled={sendingMessage}
                      >
                        {sendingMessage ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane"></i>
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="notifications-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveTab('all')}
          >
            <span>All</span>
            <span className="count">{notifications.length}</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`} 
            onClick={() => setActiveTab('sent')}
          >
            <span>Sent</span>
            <span className="count">{sentCount}</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`} 
            onClick={() => setActiveTab('unread')}
          >
            <span>Unread</span>
            <span className="count">{unreadCount}</span>
          </button>
        </div>
        
        <div className="notifications-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <i className="fa-solid fa-exclamation-circle"></i>
              <h3>Loading failed</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                <i className="fa-solid fa-redo"></i> Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">
                <i className="fa-solid fa-bell-slash"></i>
              </div>
              <h3>No {activeTab === 'unread' ? 'unread' : activeTab === 'sent' ? 'sent' : ''} notifications</h3>
              <p>
                {activeTab === 'all' 
                  ? 'You currently have no notifications' 
                  : activeTab === 'unread' 
                    ? 'You currently have no unread notifications' 
                    : activeTab === 'sent'
                      ? 'You currently have no sent notifications'
                      : `You currently have no ${activeTab} notifications`}
              </p>
              {activeTab !== 'all' && (
                <button className="view-all-btn" onClick={() => setActiveTab('all')}>
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map(notification => {
                const { icon, color } = getNotificationIcon(notification);
                
                return (
                  <div 
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon" style={{ backgroundColor: `${color}20`, color }}>
                      <i className={`fa-solid ${icon}`}></i>
                    </div>
                    
                    <div className="notification-content">
                      <h3 className="notification-title">{notification.title}</h3>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-date">{formatDate(notification.date)}</span>
                        <span className="notification-type">
                          {notification.type === 'sent' ? 'Send' : 'Receive'}
                        </span>
                      </div>
                    </div>
                    
                    {notification.type === 'unread' && <div className="unread-indicator"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
