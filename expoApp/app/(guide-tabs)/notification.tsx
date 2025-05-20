import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

interface Notification {
  id: number;
  title: string;
  message: string;
  time?: string;
  date: string;
  isRead: boolean;
  type: 'tour' | 'system' | 'certification' | 'alert' | 'sent' | 'unread' | 'read';
  fromUserId?: number;
  toUserId?: number;
}

interface User {
  userId: number;
  username: string;
  userRole: string;
}

export default function NotificationScreen() {
  // User state
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Message sending state
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecipientResults, setShowRecipientResults] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
  // Selected notification detail
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');

  const host = Constants.expoConfig?.extra?.host;

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'New Tour Assignment',
      message: 'You have been assigned to guide "Mountain Valley Trail" on May 18.',
      time: '09:45 AM',
      date: 'Today',
      isRead: false,
      type: 'tour'
    },
    {
      id: 2,
      title: 'Tour Reminder',
      message: 'Reminder: Your tour "Canyon Adventure" is scheduled for tomorrow at 10:00 AM.',
      time: '11:30 AM',
      date: 'Yesterday',
      isRead: true,
      type: 'tour'
    },
    {
      id: 3,
      title: 'Certification Expiry',
      message: 'Your "Wilderness First Aid" certification will expire in 30 days. Please renew it.',
      time: '02:15 PM',
      date: 'May 10, 2023',
      isRead: false,
      type: 'certification'
    },
    {
      id: 4,
      title: 'Weather Alert',
      message: 'Heavy rain expected tomorrow. Some trails may be closed. Check before leading tours.',
      time: '08:20 AM',
      date: 'May 8, 2023',
      isRead: true,
      type: 'alert'
    },
    {
      id: 5,
      title: 'System Maintenance',
      message: 'The guide portal will undergo maintenance on May 20 from 11 PM to 2 AM.',
      time: '04:55 PM',
      date: 'May 5, 2023',
      isRead: true,
      type: 'system'
    },
  ]);

  // Get user info from AsyncStorage
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          setUserId(user.userId);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
  }, []);
  
  // Fetch notifications when userId is available
  useEffect(() => {
    if (!userId) return;
    
    fetchNotifications();
  }, [userId]);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/api/notifications/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map the received data to match our frontend model
      const formattedNotifications = data.map((notification: any) => {
        // 首先检查通知是否有原始类型
        let notificationType = notification.type || '';
        
        // 如果原始类型是 'sent'，保持不变
        if (notificationType === 'sent') {
          return {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            date: notification.date,
            isRead: true, // 发送的消息总是已读的
            type: 'sent',
            fromUserId: notification.from_user_id,
            toUserId: notification.to_user_id
          };
        }
        
        // 对于非sent类型的通知，检查是否已读
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          date: notification.date,
          isRead: notification.is_read,
          type: notification.is_read ? 'read' : 'unread',
          fromUserId: notification.from_user_id,
          toUserId: notification.to_user_id
        };
      });
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
      
      // Temporarily keep sample data for development
      // In production, this should be removed
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    if (!userId) return;
    
    try {
      // Find notification type before updating
      const notification = notifications.find(n => n.id === id);
      
      // Only proceed if it's an unread notification
      if (!notification || notification.type !== 'unread') {
        return;
      }
      
      // API call to mark notification as read
      const response = await fetch(`http://${host}:3000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update read status in the notification list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true, type: 'read' } 
            : notification
        )
      );
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Continue with local update even if API fails
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true, type: 'read' } 
            : notification
        )
      );
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      // API call to mark all notifications as read
      const response = await fetch(`http://${host}:3000/api/notifications/markAllRead`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update read status in the notification list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true,
          type: notification.type === 'unread' ? 'read' : notification.type
        }))
      );
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Continue with local update even if API fails
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true,
          type: notification.type === 'unread' ? 'read' : notification.type
        }))
      );
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'tour':
        return 'map-outline';
      case 'certification':
        return 'ribbon-outline';
      case 'alert':
        return 'warning-outline';
      case 'system':
        return 'settings-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'tour':
        return '#4CAF50';
      case 'alert':
        return '#F44336';
      case 'certification':
        return '#2196F3';
      case 'system':
        return '#9C27B0';
      case 'sent':
        return '#23a08d';
      case 'unread':
        return '#4fe0be';
      case 'read':
        return '#757575';
      default:
        return '#4fe0be'; // Changed from #FF6B00 to match the new theme
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
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

  const renderNotificationItem = (notification: Notification) => {
    let icon = getIconForType(notification.type);
    
    // For API-fetched notifications with 'sent', 'read', 'unread' types
    if (notification.type === 'sent') {
      icon = 'paper-plane-outline';
    } else if (notification.type === 'read' || notification.type === 'unread') {
      icon = 'mail-outline';
    }
    
    return (
      <TouchableOpacity 
        key={notification.id} 
        style={[
          styles.notificationCard,
          notification.type === 'unread' && styles.unreadNotification
        ]}
        onPress={() => handleNotificationDetail(notification)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${getColorForType(notification.type)}20` }]}>
          <Ionicons name={icon as any} size={24} color={getColorForType(notification.type)} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {notification.type === 'unread' && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {notification.time || formatDate(notification.date)}
            </Text>
            <Text style={styles.notificationDate}>
              {notification.type === 'sent' ? 'Sent' : 
               notification.type === 'read' ? 'Read' : 
               notification.type === 'unread' ? 'Unread' : notification.type}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Handle notification detail view
  const handleNotificationDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    
    // Mark as read if it's unread
    if (notification.type === 'unread') {
      markAsRead(notification.id);
    }
  };
  
  // Close notification detail
  const closeNotificationDetail = () => {
    setShowNotificationDetail(false);
    setSelectedNotification(null);
  };
  
  // Fetch users for recipient selection
  const fetchUsers = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`http://${host}:3000/api/users?currentUserId=${userId}`);
      
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
  
  // Open send message modal
  const openSendMessage = () => {
    setShowSendMessage(true);
    fetchUsers();
    setMessageTitle('');
    setMessageContent('');
    setSelectedRecipient(null);
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
    if (!userId || !selectedRecipient) {
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
      const response = await fetch(`http://${host}:3000/api/messages/send`, {
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
      
      // Update local notifications to include the sent message
      const sentNotification: Notification = {
        id: data.sentNotificationId,
        type: 'sent',
        title: messageTitle,
        message: messageContent,
        date: new Date().toISOString(),
        isRead: true,
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
        setSelectedRecipient(null);
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

  // Show loading indicator while user info is being fetched
  if (loading && !messageSent) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4fe0be" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4fe0be', '#23a08d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="notifications" size={40} color="white" />
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>Stay updated with latest activity</Text>
      </LinearGradient>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={openSendMessage}>
          <Ionicons name="paper-plane-outline" size={18} color="white" />
          <Text style={styles.sendButtonText}>Send Message</Text>
        </TouchableOpacity>
        
        {notifications.some(n => n.type === 'unread') && (
          <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={18} color="#3A8A3D" />
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Main content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={50} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {notifications.filter(n => {
              if (activeTab === 'all') return true;
              if (activeTab === 'unread') return n.type === 'unread';
              if (activeTab === 'sent') return n.type === 'sent';
              return false;
            }).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={50} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>
                  No {activeTab === 'unread' ? 'unread' : activeTab === 'sent' ? 'sent' : ''} notifications
                </Text>
              </View>
            ) : (
              notifications
                .filter(n => {
                  if (activeTab === 'all') return true;
                  if (activeTab === 'unread') return n.type === 'unread';
                  if (activeTab === 'sent') return n.type === 'sent';
                  return false;
                })
                .map(renderNotificationItem)
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Notification Detail Modal */}
      <Modal
        visible={showNotificationDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNotificationDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Details</Text>
              <TouchableOpacity onPress={closeNotificationDetail}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedNotification && (
              <ScrollView style={styles.notificationDetail}>
                <Text style={styles.notificationDetailTitle}>{selectedNotification.title}</Text>
                
                <Text style={styles.notificationDetailDate}>
                  {selectedNotification.time || formatDate(selectedNotification.date)}
                </Text>
                
                <Text style={styles.notificationDetailMessage}>{selectedNotification.message}</Text>
                
                <View style={styles.userInfo}>
                  {selectedNotification.type === 'sent' ? (
                    <Text style={styles.userInfoText}>
                      To: User ID {selectedNotification.toUserId}
                    </Text>
                  ) : (
                    <Text style={styles.userInfoText}>
                      From: {selectedNotification.fromUserId ? `User ID ${selectedNotification.fromUserId}` : 'System'}
                    </Text>
                  )}
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={closeNotificationDetail}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                  
                  {(selectedNotification.type === 'unread' || selectedNotification.type === 'read') && 
                   selectedNotification.fromUserId && (
                    <TouchableOpacity 
                      style={styles.replyButton}
                      onPress={() => {
                        closeNotificationDetail();
                        openSendMessage();
                        setSelectedRecipient(selectedNotification.fromUserId || null);
                        setMessageTitle(`Re: ${selectedNotification.title}`);
                      }}
                    >
                      <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Send Message Modal */}
      <Modal
        visible={showSendMessage}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSendMessage}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Message</Text>
                <TouchableOpacity onPress={closeSendMessage}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {messageSent ? (
                <View style={styles.successMessage}>
                  <Ionicons name="checkmark-circle" size={50} color="#4BB543" />
                  <Text style={styles.successText}>Message sent successfully!</Text>
                </View>
              ) : (
                <ScrollView style={styles.sendMessageForm}>
                  <Text style={styles.inputLabel}>Recipient</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Search for a user..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onFocus={() => fetchUsers()}
                  />
                  
                  {searchTerm.length > 0 && (
                    <View style={styles.searchResults}>
                      {recipients
                        .filter(user => 
                          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.userRole.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(user => (
                          <TouchableOpacity 
                            key={user.userId} 
                            style={styles.searchResultItem}
                            onPress={() => {
                              setSelectedRecipient(user.userId);
                              setSelectedRecipientName(user.username);
                              setSearchTerm(user.username);
                            }}
                          >
                            <Text style={styles.searchResultName}>{user.username}</Text>
                            <Text style={styles.searchResultRole}>{user.userRole}</Text>
                          </TouchableOpacity>
                        ))
                      }
                    </View>
                  )}
                  
                  {selectedRecipient && (
                    <View style={styles.selectedRecipient}>
                      <Text>Selected: <Text style={styles.boldText}>{selectedRecipientName}</Text></Text>
                    </View>
                  )}
                  
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter message title"
                    value={messageTitle}
                    onChangeText={setMessageTitle}
                  />
                  
                  <Text style={styles.inputLabel}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Type your message here..."
                    value={messageContent}
                    onChangeText={setMessageContent}
                    multiline
                    numberOfLines={4}
                  />
                  
                  {messageError && (
                    <View style={styles.errorMessage}>
                      <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                      <Text style={styles.errorMessageText}>{messageError}</Text>
                    </View>
                  )}
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={closeSendMessage}
                      disabled={sendingMessage}
                    >
                      <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.sendButton}
                      onPress={handleSendMessage}
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F2F8F2',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
  },
  
  // New styles for API integration
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  retryButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  
  // Action buttons
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 5,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#3A8A3D',
  },
  markAllReadText: {
    color: '#3A8A3D',
    fontWeight: '500',
    marginLeft: 5,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    height: '50%',
    // maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Notification detail styles
  notificationDetail: {
    flex: 1,
  },
  notificationDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  notificationDetailDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  notificationDetailMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  userInfo: {
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  closeButtonText: {
    color: '#666',
  },
  replyButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  replyButtonText: {
    color: 'white',
  },
  
  // Send message form styles
  sendMessageForm: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  searchResults: {
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 5,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultName: {
    fontSize: 16,
    color: '#333',
  },
  searchResultRole: {
    fontSize: 14,
    color: '#888',
  },
  selectedRecipient: {
    marginTop: 5,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  errorMessageText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 5,
  },
  successMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 16,
    color: '#4BB543',
    fontWeight: 'bold',
    marginTop: 10,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
  },
}); 