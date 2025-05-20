import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Alert, Modal, Switch, Dimensions } from 'react-native';
import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

// Define proper types
interface Certification {
  id: number;
  title: string;
  type: string;
  description: string;
  icon: any; // Using any type to avoid strict Ionicons name type checking
  issueDate?: string;
  expiryDate?: string;
  validUntil?: string;
  issuedOn?: string;
  expiredOn?: string;
  status: string;
  applicationDate?: string;
  appliedOn?: string;
  approvedOn?: string;
  estimatedReviewTime?: string;
  category?: string;
  progress?: number;
  topicsCompleted?: string;
  nextTopic?: string;
  duration?: string;
  difficulty?: string;
  topicsCount?: string;
  details?: any; // For certificate details
}

export default function CertificationsScreen() {
  // Tab state
  const [activeMainTab, setActiveMainTab] = useState('certifications');
  const [activeCertTab, setActiveCertTab] = useState('owned');
  const [searchQuery, setSearchQuery] = useState('');
  
  // API data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownedCertificates, setOwnedCertificates] = useState<Certification[]>([]);
  const [availableCertificates, setAvailableCertificates] = useState<Certification[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Certification[]>([]);
  const [inProgressCertificates, setInProgressCertificates] = useState<Certification[]>([]);
  
  // Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certification | null>(null);
  const [confirmPrerequisites, setConfirmPrerequisites] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  
  // Certificate view modal states
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateToView, setCertificateToView] = useState<Certification | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  
  const router = useRouter();
  
  // Get user info
  const [userId, setUserId] = useState<number | null>(null);
  const host = Constants.expoConfig?.extra?.host;
  
  // Get user ID from AsyncStorage
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
  
  // API functions
  
  // Fetch certified certificates
  const fetchCertifiedCertificates = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/api/users/${userId}/certified-certificates`);
      const data = await response.json();
      
      if (data.success) {
        // Map to our Certification type
        const formattedCertificates = data.certificates.map((cert: any) => ({
          id: cert.id,
          title: cert.title,
          type: cert.type,
          description: cert.description,
          icon: mapTypeToIcon(cert.type),
          status: 'Active',
          validUntil: cert.validUntil,
          issuedOn: cert.issuedOn,
          category: cert.category
        }));
        
        setOwnedCertificates(formattedCertificates);
      } else {
        setError(data.message || 'Failed to get certified certificates');
      }
    } catch (err) {
      console.error('Error fetching certified certificates:', err);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch available certificates
  const fetchAvailableCertificates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/api/certificates/available`);
      const data = await response.json();
      
      if (data.success) {
        // Map to our Certification type
        const formattedCertificates = data.certificates.map((cert: any) => ({
          id: cert.id,
          title: cert.title,
          type: cert.type,
          description: cert.description,
          icon: mapTypeToIcon(cert.type),
          status: 'Available',
          duration: cert.duration,
          difficulty: cert.difficulty,
          topicsCount: cert.topicsCount,
          category: cert.category
        }));
        
        setAvailableCertificates(formattedCertificates);
      } else {
        setError(data.message || 'Failed to get available certificates');
      }
    } catch (err) {
      console.error('Error fetching available certificates:', err);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch pending applications
  const fetchPendingApplications = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/api/users/${userId}/certificate-applications?statusCategory=pending`);
      const data = await response.json();
      
      if (data.success) {
        // Map to our Certification type
        const formattedApplications = data.applications.map((app: any) => ({
          id: app.id,
          title: app.title,
          type: app.type,
          description: app.description,
          icon: mapTypeToIcon(app.type),
          status: app.status || 'Pending Approval',
          appliedOn: app.appliedOn,
          estimatedReviewTime: app.estimatedReviewTime,
          category: app.category
        }));
        
        setPendingApplications(formattedApplications);
      } else {
        setError(data.message || 'Failed to get pending applications');
      }
    } catch (err) {
      console.error('Error fetching pending applications:', err);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch in progress certificates
  const fetchInProgressCertificates = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${host}:3000/api/users/${userId}/certificate-applications?status=In Progress`);
      const data = await response.json();
      
      if (data.success) {
        // Map to our Certification type
        const formattedCertificates = data.applications.map((app: any) => ({
          id: app.id,
          title: app.title,
          type: app.type,
          description: app.description,
          icon: mapTypeToIcon(app.type),
          status: 'In Progress',
          progress: app.progress || 0,
          topicsCompleted: app.topicsCompleted || '0 of 0',
          nextTopic: app.nextTopic,
          approvedOn: app.approvedOn,
          category: app.category
        }));
        
        setInProgressCertificates(formattedCertificates);
      } else {
        setError(data.message || 'Failed to get in-progress certificates');
      }
    } catch (err) {
      console.error('Error fetching in-progress certificates:', err);
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };
  
  // Submit application
  const submitApplication = async (certificateId: number) => {
    if (!userId) {
      Alert.alert('Error', 'You need to be logged in to apply for certificates');
      return;
    }
    
    try {
      const response = await fetch(`http://${host}:3000/api/certificate-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          certificateId: certificateId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApplicationSuccess(true);
        // Auto-hide the success message after 3 seconds
        setTimeout(() => {
          setApplicationSuccess(false);
        }, 3000);
        
        // Refresh pending applications and switch to that tab
        fetchPendingApplications();
        setActiveMainTab('pending');
      } else {
        Alert.alert('Error', data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to connect to the server');
    }
  };
  
  // Apply for certification (completing a certificate)
  const applyForCertification = async (certificateId: number) => {
    if (!userId) {
      Alert.alert('Error', 'You need to be logged in to apply for certification');
      return;
    }
    
    try {
      const response = await fetch(`http://${host}:3000/api/certificate-applications/certified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          certificateId: certificateId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Certification application submitted successfully!');
        fetchInProgressCertificates();
      } else {
        Alert.alert('Error', data.message || 'Failed to apply for certification');
      }
    } catch (error) {
      console.error('Error applying for certification:', error);
      Alert.alert('Error', 'Failed to connect to the server');
    }
  };
  
  // Helper function to map certificate type to icon
  const mapTypeToIcon = (type: string): string => {
    const typeMapping: Record<string, string> = {
      'Safety': 'medkit',
      'Technical': 'construct',
      'Guiding': 'compass',
      'Conservation': 'leaf',
      'Education': 'school',
      'Wilderness': 'trail-sign',
      'Environmental': 'earth',
      'Navigation': 'navigate',
      'Rescue': 'warning'
    };
    
    // Try to find a direct match
    if (typeMapping[type]) {
      return typeMapping[type];
    }
    
    // Otherwise look for partial matches
    for (const [key, value] of Object.entries(typeMapping)) {
      if (type.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Default icon
    return 'document-text';
  };
  
  // Load data based on active tab
  useEffect(() => {
    if (!userId) return;
    
    if (activeMainTab === 'certifications') {
      if (activeCertTab === 'owned') {
        fetchCertifiedCertificates();
      } else if (activeCertTab === 'available') {
        fetchAvailableCertificates();
      } else if (activeCertTab === 'in_progress') {
        fetchInProgressCertificates();
      }
    } else if (activeMainTab === 'pending') {
      fetchPendingApplications();
    }
  }, [activeMainTab, activeCertTab, userId]);
  
  // Filter certifications based on search query
  const filterCertifications = (certs: Certification[]) => {
    if (!searchQuery) return certs;
    return certs.filter(cert => 
      cert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Handle apply button
  const handleApply = (cert: Certification) => {
    setSelectedCertificate(cert);
    setShowApplyModal(true);
    setConfirmPrerequisites(false);
  };
  
  // Handle submit application
  const handleSubmitApplication = () => {
    if (!selectedCertificate || !confirmPrerequisites) return;
    
    submitApplication(selectedCertificate.id);
    setShowApplyModal(false);
  };
  
  // Handle continue button for in-progress certificates
  const handleContinue = (certificateId: number) => {
    // Navigate to certificate progress details page
    router.push(`/progressDetails/${certificateId}`);
  };
  
  // Handle apply for certification (completing a certificate)
  const handleApplyForCertification = (certificateId: number) => {
    applyForCertification(certificateId);
  };

  // Handle view certificate function
  const handleViewCertificate = (cert: Certification) => {
    setCertificateToView(null); // 清空之前的证书数据
    setShowCertificateModal(true);
    setCertificateLoading(true);
    
    // 使用API获取证书详情
    fetch(`http://${host}:3000/api/certificates/${cert.id}/details?userId=${userId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setCertificateToView({
            ...cert,
            details: data.certificate
          });
        } else {
          console.error('Failed to fetch certificate details:', data.message);
          Alert.alert('Error', 'Failed to load certificate details. Please try again.');
        }
        setCertificateLoading(false);
      })
      .catch(error => {
        console.error('Error fetching certificate details:', error);
        Alert.alert('Error', 'Error loading certificate details. Please check your connection and try again.');
        setCertificateLoading(false);
      });
  };

  const handleViewTopic = (topicId: number) => {
    // Navigate to topic details page
    router.push(`/topic/${topicId}`);
  };

  const renderCertificationCard = (cert: Certification) => (
    <TouchableOpacity key={cert.id} style={styles.certCard}>
      <View style={styles.certIconContainer}>
        <Ionicons name={cert.icon} size={32} color="#4fe0be" />
      </View>
      
      <View style={styles.certContent}>
        <Text style={styles.certName}>{cert.title}</Text>
        <Text style={styles.certIssuer}>{cert.type}</Text>
        
        <Text style={styles.descriptionText}>{cert.description}</Text>
        
        {cert.status === 'Active' && (
          <>
            {cert.issuedOn && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Issued:</Text>
                <Text style={styles.certDetailValue}>{cert.issuedOn}</Text>
              </View>
            )}
            
            {cert.validUntil && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Valid Until:</Text>
                <Text style={styles.certDetailValue}>{cert.validUntil}</Text>
              </View>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => handleViewCertificate(cert)}
              >
                <Text style={styles.viewButtonText}>View Certificate</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
         
        {cert.status === 'Pending Approval' && (
          <>
            {cert.appliedOn && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Applied:</Text>
                <Text style={styles.certDetailValue}>{cert.appliedOn}</Text>
              </View>
            )}
            
            {cert.estimatedReviewTime && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Review Time:</Text>
                <Text style={styles.certDetailValue}>{cert.estimatedReviewTime}</Text>
              </View>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={styles.pendingStatusText}>Pending Approval</Text>
              </View>
              
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Application</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {cert.status === 'In Progress' && (
          <>
            {cert.approvedOn && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Approved:</Text>
                <Text style={styles.certDetailValue}>{cert.approvedOn}</Text>
              </View>
            )}
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${cert.progress || 0}%` }]} />
            </View>
            
            <Text style={styles.progressText}>
              {cert.progress || 0}% Completed
            </Text>
            
            {cert.topicsCompleted && (
              <Text style={styles.topicsCompleted}>{cert.topicsCompleted}</Text>
            )}
            
            {cert.nextTopic && (
              <Text style={styles.nextTopic}>Next: {cert.nextTopic}</Text>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, styles.inProgressBadge]}>
                <Text style={styles.inProgressText}>In Progress</Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleContinue(cert.id)}
                >
                  <Text style={styles.viewButtonText}>Continue</Text>
                </TouchableOpacity>
                
                {cert.progress === 100 && (
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={() => handleApplyForCertification(cert.id)}
                  >
                    <Text style={styles.applyButtonText}>Apply for Certified</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}

        {cert.status === 'Available' && (
          <>
            {cert.duration && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Duration:</Text>
                <Text style={styles.certDetailValue}>{cert.duration}</Text>
              </View>
            )}
            
            {cert.difficulty && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Difficulty:</Text>
                <Text style={styles.certDetailValue}>{cert.difficulty}</Text>
              </View>
            )}
            
            {cert.topicsCount && (
              <View style={styles.certDetailItem}>
                <Text style={styles.certDetailLabel}>Topics:</Text>
                <Text style={styles.certDetailValue}>{cert.topicsCount}</Text>
              </View>
            )}
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, styles.availableBadge]}>
                <Text style={styles.availableText}>Available</Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>Learn More</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => handleApply(cert)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Return loading indicator if user ID is not yet retrieved
  if (userId === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4fe0be" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Tabs */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity 
          style={[styles.mainTab, activeMainTab === 'certifications' && styles.activeMainTab]}
          onPress={() => setActiveMainTab('certifications')}
        >
          <Text style={[styles.mainTabText, activeMainTab === 'certifications' && styles.activeMainTabText]}>
            Certifications
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mainTab, activeMainTab === 'pending' && styles.activeMainTab]}
          onPress={() => setActiveMainTab('pending')}
        >
          <Text style={[styles.mainTabText, activeMainTab === 'pending' && styles.activeMainTabText]}>
            Pending Applications
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {applicationSuccess && (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
            <Text style={styles.successText}>Application submitted successfully!</Text>
          </View>
        )}
        
        {activeMainTab === 'certifications' ? (
          <>
            <LinearGradient
              colors={['#4fe0be', '#23a08d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Ionicons name="ribbon" size={40} color="white" />
              <Text style={styles.headerTitle}>My Certifications</Text>
              <Text style={styles.headerSubtitle}>Keep all your qualifications updated</Text>
            </LinearGradient>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#78909C" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search certifications..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#78909C" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Certification Tabs */}
            <View style={styles.certTabContainer}>
              <TouchableOpacity 
                style={[styles.certTab, activeCertTab === 'owned' && styles.activeCertTab]}
                onPress={() => setActiveCertTab('owned')}
              >
                <Text style={[styles.certTabText, activeCertTab === 'owned' && styles.activeCertTabText]}>
                  Owned
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.certTab, activeCertTab === 'in_progress' && styles.activeCertTab]}
                onPress={() => setActiveCertTab('in_progress')}
              >
                <Text style={[styles.certTabText, activeCertTab === 'in_progress' && styles.activeCertTabText]}>
                  In Progress
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.certTab, activeCertTab === 'available' && styles.activeCertTab]}
                onPress={() => setActiveCertTab('available')}
              >
                <Text style={[styles.certTabText, activeCertTab === 'available' && styles.activeCertTabText]}>
                  Available
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.contentContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4fe0be" />
                  <Text style={styles.loadingText}>Loading certifications...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={40} color="#F44336" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      if (activeCertTab === 'owned') {
                        fetchCertifiedCertificates();
                      } else if (activeCertTab === 'available') {
                        fetchAvailableCertificates();
                      } else if (activeCertTab === 'in_progress') {
                        fetchInProgressCertificates();
                      }
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {activeCertTab === 'owned' && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Certifications</Text>
                        <TouchableOpacity style={styles.addButton}>
                          <Ionicons name="filter" size={20} color="white" />
                          <Text style={styles.addButtonText}>Filter</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {ownedCertificates.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Ionicons name="document" size={50} color="#78909C" />
                          <Text style={styles.emptyStateText}>No certified certificates found</Text>
                        </View>
                      ) : (
                        filterCertifications(ownedCertificates).map(renderCertificationCard)
                      )}
                    </>
                  )}
                  
                  {activeCertTab === 'in_progress' && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Certifications In Progress</Text>
                        <TouchableOpacity style={styles.addButton}>
                          <Ionicons name="filter" size={20} color="white" />
                          <Text style={styles.addButtonText}>Filter</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {inProgressCertificates.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Ionicons name="hourglass" size={50} color="#78909C" />
                          <Text style={styles.emptyStateText}>No certifications in progress</Text>
                        </View>
                      ) : (
                        filterCertifications(inProgressCertificates).map(renderCertificationCard)
                      )}
                    </>
                  )}
                  
                  {activeCertTab === 'available' && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Certifications</Text>
                        <TouchableOpacity style={styles.addButton}>
                          <Ionicons name="filter" size={20} color="white" />
                          <Text style={styles.addButtonText}>Filter</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {availableCertificates.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Ionicons name="list" size={50} color="#78909C" />
                          <Text style={styles.emptyStateText}>No available certifications found</Text>
                        </View>
                      ) : (
                        filterCertifications(availableCertificates).map(renderCertificationCard)
                      )}
                    </>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <LinearGradient
              colors={['#4fe0be', '#23a08d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Ionicons name="time" size={40} color="white" />
              <Text style={styles.headerTitle}>Pending Applications</Text>
              <Text style={styles.headerSubtitle}>Track your certification applications</Text>
            </LinearGradient>
            
            <View style={styles.contentContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4fe0be" />
                  <Text style={styles.loadingText}>Loading applications...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={40} color="#F44336" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={fetchPendingApplications}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Under Review</Text>
                  </View>
                  
                  {pendingApplications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="document-text" size={50} color="#78909C" />
                      <Text style={styles.emptyStateText}>No pending applications</Text>
                    </View>
                  ) : (
                    filterCertifications(pendingApplications).map(renderCertificationCard)
                  )}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Certificate View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCertificateModal}
        onRequestClose={() => setShowCertificateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certificateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate Details</Text>
              <TouchableOpacity 
                onPress={() => setShowCertificateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#455A64" />
              </TouchableOpacity>
            </View>
            
            {certificateLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4fe0be" />
                <Text style={styles.loadingText}>Loading certificate details...</Text>
              </View>
            ) : certificateToView ? (
              <ScrollView style={styles.certificateDetailsScroll}>
                <View style={styles.certificateHeaderSection}>
                  <View style={styles.certIconContainerLarge}>
                    <Ionicons name={certificateToView.icon} size={40} color="#4fe0be" />
                  </View>
                  <Text style={styles.certificateTitle}>{certificateToView.title}</Text>
                  <Text style={styles.certificateType}>{certificateToView.type}</Text>
                  
                  <View style={[styles.statusBadge, styles.activeBadge, { alignSelf: 'center', marginTop: 10 }]}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
                
                <View style={styles.certificateInfoSection}>
                  <Text style={styles.certificateSectionTitle}>Certificate Information</Text>
                  
                  <View style={styles.certDetailRow}>
                    <Text style={styles.certDetailLabel}>Category:</Text>
                    <Text style={styles.certDetailValue}>{certificateToView.category || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.certDetailRow}>
                    <Text style={styles.certDetailLabel}>Issued On:</Text>
                    <Text style={styles.certDetailValue}>{certificateToView.issuedOn || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.certDetailRow}>
                    <Text style={styles.certDetailLabel}>Valid Until:</Text>
                    <Text style={styles.certDetailValue}>{certificateToView.validUntil || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.certDetailRow}>
                    <Text style={styles.certDetailLabel}>Certificate ID:</Text>
                    <Text style={styles.certDetailValue}>CERT-{certificateToView.id.toString().padStart(6, '0')}</Text>
                  </View>
                </View>
                
                <View style={styles.certificateDescriptionSection}>
                  <Text style={styles.certificateSectionTitle}>Description</Text>
                  <Text style={styles.certificateDescription}>{certificateToView.description}</Text>
                </View>
                
                {certificateToView.details?.skills && (
                  <View style={styles.certificateSkillsSection}>
                    <Text style={styles.certificateSectionTitle}>Skills Verified</Text>
                    {certificateToView.details.skills.map((skill: string, index: number) => (
                      <View key={index} style={styles.skillItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>Download Certificate</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color="#F44336" />
                <Text style={styles.errorText}>Failed to load certificate details</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Application Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showApplyModal}
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate Application</Text>
              <TouchableOpacity 
                onPress={() => setShowApplyModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#455A64" />
              </TouchableOpacity>
            </View>
            
            {selectedCertificate && (
              <>
                <View style={styles.selectedCertInfo}>
                  <View style={styles.modalCertIconContainer}>
                    <Ionicons name={selectedCertificate.icon} size={32} color="#4fe0be" />
                  </View>
                  <View style={styles.certTextInfo}>
                    <Text style={styles.certNameModal}>{selectedCertificate.title}</Text>
                    <Text style={styles.certIssuerModal}>{selectedCertificate.type}</Text>
                  </View>
                </View>
                
                <Text style={styles.modalSectionTitle}>Prerequisites</Text>
                <Text style={styles.prerequisiteText}>
                  Before applying for this certification, please ensure you meet the following requirements:
                </Text>
                
                <View style={styles.prerequisiteItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
                  <Text style={styles.prerequisiteItemText}>Active account in good standing</Text>
                </View>
                
                <View style={styles.prerequisiteItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
                  <Text style={styles.prerequisiteItemText}>Minimum 6 months experience as a guide</Text>
                </View>
                
                <View style={styles.prerequisiteItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
                  <Text style={styles.prerequisiteItemText}>Agreement to complete all required modules</Text>
                </View>
                
                <View style={styles.confirmContainer}>
                  <Switch
                    value={confirmPrerequisites}
                    onValueChange={setConfirmPrerequisites}
                    trackColor={{ false: '#ccc', true: '#4fe0be' }}
                    thumbColor={'#fff'}
                  />
                  <Text style={styles.confirmText}>
                    I confirm that I meet all prerequisites for this certification
                  </Text>
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowApplyModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.submitButton, 
                      !confirmPrerequisites && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitApplication}
                    disabled={!confirmPrerequisites}
                  >
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4fe0be',
  },
  mainTabText: {
    fontSize: 14,
    color: '#78909C',
  },
  activeMainTabText: {
    color: '#4fe0be',
    fontWeight: 'bold',
  },
  certTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  certTab: {
    marginRight: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeCertTab: {
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
  },
  certTabText: {
    fontSize: 14,
    color: '#78909C',
  },
  activeCertTabText: {
    color: '#4fe0be',
    fontWeight: '500',
  },
  header: {
    padding: 25,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  contentContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
  },
  addButton: {
    backgroundColor: '#23a08d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
  },
  certCard: {
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
  certIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#455A64',
  },
  certIssuer: {
    fontSize: 14,
    color: '#78909C',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#607D8B',
    marginBottom: 10,
    lineHeight: 20,
  },
  certDetails: {
    marginBottom: 10,
  },
  certDetailItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  certDetailLabel: {
    fontSize: 14,
    color: '#78909C',
    width: 60,
  },
  certDetailValue: {
    fontSize: 14,
    color: '#455A64',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(3, 169, 244, 0.1)',
  },
  availableBadge: {
    backgroundColor: 'rgba(103, 58, 183, 0.1)',
  },
  statusText: {
    fontSize: 12,
    color: '#4fe0be',
    fontWeight: 'bold',
  },
  pendingStatusText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: 'bold',
  },
  inProgressText: {
    fontSize: 12,
    color: '#03A9F4',
    fontWeight: 'bold',
  },
  availableText: {
    fontSize: 12,
    color: '#673AB7',
    fontWeight: 'bold',
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  viewButtonText: {
    color: '#4fe0be',
    fontSize: 12,
  },
  enrollButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4fe0be',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 10,
  },
  successMessage: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4fe0be',
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 10,
  },
  retryButton: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  retryButtonText: {
    color: '#4fe0be',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#78909C',
    marginTop: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#23a08d',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
  },
  topicsCompleted: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 10,
  },
  nextTopic: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4fe0be',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
  },
  closeButton: {
    padding: 5,
  },
  selectedCertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  certTextInfo: {
    flex: 1,
  },
  certNameModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#455A64',
  },
  certIssuerModal: {
    fontSize: 14,
    color: '#78909C',
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
    marginBottom: 10,
  },
  prerequisiteText: {
    fontSize: 14,
    color: '#607D8B',
    marginBottom: 10,
  },
  prerequisiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  prerequisiteItemText: {
    fontSize: 14,
    color: '#607D8B',
    marginLeft: 5,
  },
  confirmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: '#607D8B',
    marginLeft: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  cancelButtonText: {
    color: '#4fe0be',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#23a08d',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  certificateModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  certificateDetailsScroll: {
    flexGrow: 0,
  },
  certificateHeaderSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  certIconContainerLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  certificateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#455A64',
    textAlign: 'center',
  },
  certificateType: {
    fontSize: 16,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 5,
  },
  certificateInfoSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  certificateSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
    marginBottom: 15,
  },
  certDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  certificateDescriptionSection: {
    marginBottom: 20,
  },
  certificateDescription: {
    fontSize: 14,
    color: '#607D8B',
    lineHeight: 20,
  },
  certificateSkillsSection: {
    marginBottom: 20,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillText: {
    fontSize: 14,
    color: '#607D8B',
    marginLeft: 10,
  },
  downloadButton: {
    backgroundColor: '#23a08d',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 