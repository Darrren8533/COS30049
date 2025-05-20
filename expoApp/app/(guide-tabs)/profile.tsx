import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

// API URL - should be from environment variables in production
const host = Constants.expoConfig?.extra?.host;
const API_URL = `http://${host}:3000`;

interface User {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  bio: string;
  experience: string;
  specializations: string[];
  certifications: Certification[];
}

interface Certification {
  id: string;
  name: string;
  issueDate: string;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [activeLink, setActiveLink] = useState('profile');
  const [user, setUser] = useState<User>({
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
  const [editedUser, setEditedUser] = useState<User>({} as User);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUserId(userData.userId);
        }
      } catch (err) {
        console.error('Error getting user from storage:', err);
      }
    };
    
    getUserId();
  }, []);

  // Get user data
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/users/${userId}`);
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

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser(user); // Reset to original data when canceled
    }
    setIsEditing(!isEditing);
  };

  // Handle input change
  const handleInputChange = (name: string, value: string) => {
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };

  // Handle multi-select change
  const handleSpecializationChange = (value: string, isChecked: boolean) => {
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

  // Open logout confirmation dialog
  const openLogoutConfirm = () => {
    console.log("Logout button pressed"); // Add log to confirm button click
    setShowLogoutConfirm(true);
  };

  // Perform logout operation
  const performLogout = async () => {
    try {
      console.log("Logout confirmed"); // Add log to confirm user logout
      // Clear stored user data
      await AsyncStorage.removeItem('user');
      //   await AsyncStorage.removeItem('token');
      
      // Navigate to login page
      router.push('/(tabs)/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Logout Failed', 'An error occurred during logout. Please try again.');
    }
  };

  // Save profile information
  const handleSaveProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
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
        
        // Clear success message after 3 seconds
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

  // Render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;
    
    return (
      <View style={styles.successMessage}>
        <Ionicons name="checkmark-circle" size={24} color="#2e7d32" />
        <Text style={styles.successMessageText}>{successMessage}</Text>
      </View>
    );
  };

  // Render custom logout confirmation dialog
  const renderLogoutConfirmModal = () => {
    return (
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutConfirmButton]} 
                onPress={() => {
                  setShowLogoutConfirm(false);
                  performLogout();
                }}
              >
                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render loading status
  if (loading && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  // Render error status
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setError(null)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Logout confirmation dialog */}
      {renderLogoutConfirmModal()}
      
      {/* Success message */}
      {renderSuccessMessage()}
      
      {/* Page header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileTitle}>
          <Text style={styles.profileTitleText}>My Profile</Text>
          <Text style={styles.profileTitleDesc}>
            Manage your personal information and preferences
          </Text>
        </View>
        
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={[styles.editButton, isEditing && styles.editButtonActive]}
            onPress={handleEditToggle}
          >
            <Ionicons 
              name={isEditing ? "close" : "pencil"} 
              size={20} 
              color={isEditing ? "#fff" : "#2e7d32"} 
            />
            <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
          
          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Personal information section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Username</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={editedUser.username}
              onChangeText={(text) => handleInputChange('username', text)}
              editable={false}
            />
          ) : (
            <Text style={styles.fieldValue}>{user.username}</Text>
          )}
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedUser.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
            />
          ) : (
            <Text style={styles.fieldValue}>{user.email}</Text>
          )}
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedUser.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
            />
          ) : (
            <Text style={styles.fieldValue}>
              {user.fullName || 'Not specified'}
            </Text>
          )}
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedUser.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>
              {user.phoneNumber || 'Not specified'}
            </Text>
          )}
        </View>
      </View>
      
      {/* Professional information section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Bio</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedUser.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              multiline={true}
              numberOfLines={4}
              placeholder="Write a short bio about yourself..."
            />
          ) : (
            <Text style={styles.fieldValue}>
              {user.bio || 'No bio information provided.'}
            </Text>
          )}
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Experience</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedUser.experience}
              onChangeText={(text) => handleInputChange('experience', text)}
              multiline={true}
              numberOfLines={3}
              placeholder="Describe your experience as a park guide..."
            />
          ) : (
            <Text style={styles.fieldValue}>
              {user.experience || 'No experience information provided.'}
            </Text>
          )}
        </View>
      </View>
      
      {/* Certification section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Certifications</Text>
        
        {user.certifications && user.certifications.length > 0 ? (
          <View style={styles.certificationsList}>
            {user.certifications.map(cert => (
              <View key={cert.id} style={styles.certificationItem}>
                <View style={styles.certificationIcon}>
                  <Ionicons name="ribbon" size={24} color="#2e7d32" />
                </View>
                <View style={styles.certificationDetails}>
                  <Text style={styles.certificationName}>{cert.name}</Text>
                  <Text style={styles.certificationDate}>
                    Issued: {cert.issueDate}
                  </Text>
                  <Text style={styles.certificationStatus}>
                    Status: {' '}
                    <Text style={[
                      styles.statusText,
                      { color: cert.status.toLowerCase() === 'active' ? '#2e7d32' : '#f57c00' }
                    ]}>
                      {cert.status}
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCertifications}>
            <Text style={styles.emptyCertificationsText}>
              You don't have any certifications yet. Start your certification journey!
            </Text>
            <TouchableOpacity
              style={styles.browseCertificationsButton}
              onPress={() => router.push('/certifications')}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.browseCertificationsButtonText}>
                Browse Certifications
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Logout section - change button implementation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={openLogoutConfirm}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  errorMessage: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  successMessageText: {
    color: '#2e7d32',
    fontSize: 16,
    marginLeft: 8,
  },
  profileHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileTitle: {
    marginBottom: 16,
  },
  profileTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e3a59',
  },
  profileTitleDesc: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonActive: {
    backgroundColor: '#d32f2f',
  },
  editButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    marginLeft: 8,
  },
  editButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3a59',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#2e3a59',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#2e3a59',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  certificationsList: {
    marginTop: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  certificationIcon: {
    marginRight: 16,
    justifyContent: 'center',
  },
  certificationDetails: {
    flex: 1,
  },
  certificationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3a59',
    marginBottom: 4,
  },
  certificationDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  certificationStatus: {
    fontSize: 14,
    color: '#666',
  },
  statusText: {
    fontWeight: 'bold',
  },
  emptyCertifications: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCertificationsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseCertificationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  browseCertificationsButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  logoutConfirmButton: {
    backgroundColor: '#d32f2f',
  },
  logoutConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
