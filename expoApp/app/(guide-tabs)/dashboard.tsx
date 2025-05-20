import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Define interface types
interface Certificate {
  id: number | string;
  title: string;
  progress: number;
  status: string;
}

interface Notification {
  id: number | string;
  title: string;
  date: string;
  read: boolean;
  created_at?: string;
  to_user_id?: number | string;
  type?: string;
  is_read?: boolean;
}

interface Tour {
  id: number | string;
  name: string;
  date: string;
  time: string;
  visitors: number;
}

interface User {
  username: string;
  fullName: string;
  email: string;
  role: string;
  registeredSince: string;
  lastActive: string;
}

interface Stats {
  user: User;
  certifications: {
    total: number;
    active: number;
    inProgress: number;
    pending: number;
    recent: Certificate[];
  };
  notifications: {
    unread: number;
    recent: Notification[];
  };
  progress: {
    topicsDone: number;
    totalTopics: number;
    quizzesPassed: number;
    totalQuizzes: number;
    lastActivity: string;
  };
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    user: {
      username: '',
      fullName: '',
      email: '',
      role: '',
      registeredSince: '',
      lastActive: '',
    },
    certifications: {
      total: 0,
      active: 0,
      inProgress: 0,
      pending: 0,
      recent: []
    },
    notifications: {
      unread: 0,
      recent: []
    },
    progress: {
      topicsDone: 0,
      totalTopics: 0,
      quizzesPassed: 0,
      totalQuizzes: 0,
      lastActivity: '',
    }
  });

  const host = Constants.expoConfig?.extra?.host;

  // Get user data from AsyncStorage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user.userId);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    
    getUserData();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile information
      const userResponse = await fetch(`http://${host}:3000/api/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userResponse.json();
      
      // Fetch Certified certificates
      const certifiedResponse = await fetch(`http://${host}:3000/api/users/${userId}/certified-certificates`);
      const certifiedData = await certifiedResponse.json();
      
      // Fetch In Progress certificates
      const inProgressResponse = await fetch(`http://${host}:3000/api/users/${userId}/certificate-applications?status=In Progress`);
      const inProgressData = await inProgressResponse.json();
      
      // Fetch pending certificate applications
      const pendingResponse = await fetch(`http://${host}:3000/api/users/${userId}/certificate-applications?statusCategory=pending`);
      const pendingData = await pendingResponse.json();
      
      // Calculate certificate statistics
      const totalCertificates = (certifiedData.success ? certifiedData.certificates.length : 0) + 
                               (inProgressData.success ? inProgressData.applications.length : 0);
      const activeCertificates = certifiedData.success ? certifiedData.certificates.length : 0;
      const inProgressCount = inProgressData.success ? inProgressData.applications.length : 0;
      const pendingCount = pendingData.success ? pendingData.applications.length : 0;
      
      // Extract details of in-progress certificates
      const recentCerts: Certificate[] = inProgressData.success ? 
        inProgressData.applications.slice(0, 3).map((cert: any) => ({
          id: cert.id,
          title: cert.title,
          progress: typeof cert.progress === 'number' ? cert.progress : 0,
          status: cert.status
        })) : [];
      
      // Get notifications data
      const notificationsResponse = await fetch(`http://${host}:3000/api/notifications/${userId}`);
      const notificationsData = await notificationsResponse.json();
      
      // Calculate unread notification count
      const notificationsUnread = notificationsData.filter(
        (notification: any) => notification.to_user_id == userId && notification.type === 'unread'
      ).length;
      
      // Get recent 3 notifications
      const recentNotifications: Notification[] = notificationsData
        .filter((notification: any) => notification.to_user_id == userId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map((notification: any) => ({
          id: notification.id,
          title: notification.title,
          date: notification.date || new Date(notification.created_at).toLocaleDateString(),
          read: notification.is_read || notification.type === 'read'
        }));

      // Calculate learning progress (derived from in-progress certificates)
      let topicsDone = 0;
      let totalTopics = 0;
      let quizzesPassed = 0;
      let totalQuizzes = 0;
      
      // If there are in-progress certificates, use the progress of the first certificate as part of the overall progress
      if (recentCerts.length > 0) {
        const firstCertProgress = recentCerts[0].progress;
        topicsDone = Math.round(firstCertProgress * 4 / 100); // Assume each certificate has 4 topics
        totalTopics = 4;
        quizzesPassed = Math.round(firstCertProgress * 4 / 100); // Assume each topic has one quiz
        totalQuizzes = 4;
      }
      
      // Update state with all fetched data
      setStats({
        user: {
          username: userData.user?.username || 'User',
          fullName: userData.user?.fullName || 'Park Guide User',
          email: userData.user?.email || 'guide@example.com',
          role: userData.user?.role || 'Guide',
          registeredSince: userData.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : 'Jan 1, 2023',
          lastActive: userData.user?.lastActive ? new Date(userData.user.lastActive).toLocaleDateString() : 'Today'
        },
        certifications: {
          total: totalCertificates,
          active: activeCertificates,
          inProgress: inProgressCount,
          pending: pendingCount,
          recent: recentCerts
        },
        notifications: {
          unread: notificationsUnread,
          recent: recentNotifications
        },
        progress: {
          topicsDone: topicsDone,
          totalTopics: totalTopics,
          quizzesPassed: quizzesPassed,
          totalQuizzes: totalQuizzes,
          lastActivity: new Date().toLocaleDateString()
        }
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      
      // Set default data to ensure the UI can display properly
      setStats(prev => ({
        ...prev,
        user: {
          ...prev.user,
          username: 'User',
          role: 'Guide'
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // Call fetchDashboardData when userId changes
  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  // Calculate overall certification progress percentage
  const calculateOverallProgress = () => {
    const { topicsDone, totalTopics, quizzesPassed, totalQuizzes } = stats.progress;
    
    if (totalTopics === 0 && totalQuizzes === 0) return 0;
    
    const topicsWeight = 0.6; // Topics are 60% of progress
    const quizzesWeight = 0.4; // Quizzes are 40% of progress
    
    const topicsProgress = totalTopics > 0 ? (topicsDone / totalTopics) * topicsWeight : 0;
    const quizzesProgress = totalQuizzes > 0 ? (quizzesPassed / totalQuizzes) * quizzesWeight : 0;
    
    return Math.round((topicsProgress + quizzesProgress) * 100);
  };

  // Navigate to certifications screen
  const goToCertifications = () => {
    router.push('/(guide-tabs)/certifications' as any);
  };

  // Navigate to notifications screen
  const goToNotifications = () => {
    router.push('/(guide-tabs)/notification' as any);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get current date
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4fe0be" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {stats.user.username}</Text>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="ribbon" size={28} color="#4fe0be" />
          <Text style={styles.statNumber}>{stats.certifications.total}</Text>
          <Text style={styles.statLabel}>Certifications</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="analytics" size={28} color="#4fe0be" />
          <Text style={styles.statNumber}>{calculateOverallProgress()}%</Text>
          <Text style={styles.statLabel}>Overall Progress</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="notifications" size={28} color="#4fe0be" />
          <Text style={styles.statNumber}>{stats.notifications.unread}</Text>
          <Text style={styles.statLabel}>Unread Notifications</Text>
        </View>
      </View>

      {/* Certifications in Progress Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>In Progress Certifications</Text>
        <TouchableOpacity onPress={goToCertifications}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {stats.certifications.recent.length > 0 ? (
        stats.certifications.recent.map(cert => (
          <TouchableOpacity key={cert.id} style={styles.certCard}>
            <View style={styles.certHeader}>
              <Ionicons name="ribbon-outline" size={24} color="#4fe0be" />
              <Text style={styles.certName}>{cert.title}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressLabel}>
                <Text>Progress</Text>
                <Text style={styles.progressPercentage}>{cert.progress}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${cert.progress}%` }]} />
              </View>
            </View>
            
            <TouchableOpacity style={styles.continueButton} onPress={() => router.push('/(guide-tabs)/certifications' as any)}>
              <Text style={styles.continueButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>You have no certifications in progress</Text>
          <TouchableOpacity style={styles.browseButton} onPress={goToCertifications}>
            <Text style={styles.browseButtonText}>Browse Available Certifications</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Recent Notifications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        <TouchableOpacity onPress={goToNotifications}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {stats.notifications.recent.length > 0 ? (
        stats.notifications.recent.map(notification => (
          <TouchableOpacity key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadNotification]}>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={24} color="#4fe0be" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDate}>{formatDate(notification.date)}</Text>
            </View>
            {!notification.read && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>New</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>You have no recent notifications</Text>
        </View>
      )}
      
      {/* Quick Links */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
      </View>
      
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToCertifications}>
          <Ionicons name="ribbon-outline" size={32} color="#4fe0be" />
          <Text style={styles.quickActionText}>Certifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(guide-tabs)/profile' as any)}>
          <Ionicons name="person-outline" size={32} color="#4fe0be" />
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard} onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={32} color="#4fe0be" />
          <Text style={styles.quickActionText}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(guide-tabs)/identification' as any)}>
          <Ionicons name="camera-outline" size={32} color="#4fe0be" />
          <Text style={styles.quickActionText}>Species Identification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4fe0be',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'transparent',
  },
  statCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4fe0be',
  },
  certCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  certName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressPercentage: {
    color: '#4fe0be',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4fe0be',
  },
  continueButton: {
    backgroundColor: '#4fe0be',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#888',
    marginBottom: 15,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4fe0be',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4fe0be',
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  unreadBadge: {
    backgroundColor: '#4fe0be',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
}); 