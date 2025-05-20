import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

// Default data structure for certificate details
interface CertData {
  id: string;
  title: string;
  type: string;
  description: string;
  progress: number;
  status: string;
  topicsCompleted: number;
  totalTopics: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  requirements: string[];
  topics: Topic[];
}

interface Topic {
  id: number;
  title: string;
  description: string;
  materials: number;
  questions: number;
}

export default function ProgressDetailsScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const host = Constants.expoConfig?.extra?.host;

  // Default data structure for certificate details
  const [certData, setCertData] = useState<CertData>({
    id: '',
    title: '',
    type: '',
    description: '',
    progress: 0,
    status: '',
    topicsCompleted: 0,
    totalTopics: 0,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
    requirements: [],
    topics: []
  });
  
  // Fetch certification data
  useEffect(() => {
    const fetchCertificateDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user ID from AsyncStorage
        const userString = await AsyncStorage.getItem('user');
        if (!userString) {
          throw new Error('User not found');
        }
        
        const currentUser = JSON.parse(userString);
        const userId = currentUser.userId;
        
        // Add userId as a query parameter if available
        const url = userId 
          ? `http://${host}:3000/api/certificates/${id}/progress?userId=${userId}`
          : `http://${host}:3000/api/certificates/${id}/progress`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch certificate details');
        }
        
        if (data.success) {
          // Map API response to component state
          const certificateData = data.certificate;
          
          // Format requirements as array if it's a string
          let requirementsArray = certificateData.requirements || [];
          if (typeof requirementsArray === 'string') {
            requirementsArray = certificateData.requirements
              .split('\n')
              .filter((line: string) => line.trim() !== '')
              .map((line: string) => line.replace(/^-\s*/, ''));
          }
          
          // Format dates if needed
          const createdAt = certificateData.createdAt 
            ? new Date(certificateData.createdAt).toLocaleString()
            : new Date().toLocaleString();
            
          const updatedAt = certificateData.updatedAt 
            ? new Date(certificateData.updatedAt).toLocaleString()
            : createdAt;
          
          setCertData({
            id: certificateData.certificateId || certificateData.id || id as string,
            title: certificateData.certificateName || certificateData.title || 'Untitled Certificate',
            type: certificateData.certificateType || certificateData.type || 'Standard',
            description: certificateData.description || 'No description available',
            progress: certificateData.progress || 0,
            status: certificateData.status || 'Not Started',
            topicsCompleted: certificateData.topicsCompleted || 0,
            totalTopics: certificateData.totalTopics || 0,
            createdBy: certificateData.createdBy || 'Admin User',
            createdAt: createdAt,
            updatedAt: updatedAt,
            requirements: requirementsArray,
            topics: certificateData.topics || []
          });
        }
      } catch (error: any) {
        console.error('Error fetching certificate details:', error);
        setError(error.message || 'Failed to fetch certificate details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCertificateDetails();
    }
  }, [id]);
  
  // Navigation
  const handleBack = () => {
    router.back();
  };
  
  const handleViewTopic = (topicId: number) => {
    // Navigate to topic details page
    router.push(`/topic/${topicId}`);
  };
  
  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Certificate Progress' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4fe0be" />
          <Text style={styles.loadingText}>Loading certificate details...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Certificate Progress' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.replace(`/progressDetails/${id}`)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to Certificates</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: certData.title
        }} 
      />
      
      {/* Certificate header */}
      <LinearGradient
        colors={['#4fe0be', '#23a08d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.titleSection}>
          <Text style={styles.certificateTitle}>{certData.title}</Text>
          <Text style={styles.certificateType}>{certData.type}</Text>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{certData.progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, {width: `${certData.progress}%`}]}></View>
          </View>
          <Text style={styles.topicsCompleted}>{certData.topicsCompleted} of {certData.totalTopics} topics completed</Text>
        </View>
      </LinearGradient>
      
      {/* Topics List */}
      <Text style={styles.topicListHeader}>Course Topics</Text>
      {certData.topics.map((topic, index) => (
        <TouchableOpacity 
          key={topic.id} 
          style={styles.topicCard}
          onPress={() => handleViewTopic(topic.id)}
        >
          <Text style={styles.topicTitle}>Topic {index + 1}: {topic.title}</Text>
          <Text style={styles.topicDescription}>{topic.description}</Text>
          
          <View style={styles.topicStatus}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color="#4fe0be" 
            />
            <Text style={styles.completedText}>Completed</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleViewTopic(topic.id)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      
      {/* Certificate Info */}
      <Text style={styles.sectionHeader}>Certificate Information</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.infoValue}>{certData.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created By</Text>
          <Text style={styles.infoValue}>{certData.createdBy}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created On</Text>
          <Text style={styles.infoValue}>{certData.createdAt}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>{certData.updatedAt}</Text>
        </View>
      </View>
      
      {/* Description */}
      <Text style={styles.sectionHeader}>Description</Text>
      <View style={styles.infoCard}>
        <Text>{certData.description}</Text>
      </View>
      
      {/* Requirements */}
      <Text style={styles.sectionHeader}>Requirements</Text>
      <View style={styles.infoCard}>
        {certData.requirements.map((req, index) => (
          <View key={index} style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4fe0be" style={styles.requirementIcon} />
            <Text style={styles.requirementText}>{req}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  headerBackButton: {
    marginBottom: 15,
  },
  titleSection: {
    marginBottom: 20,
  },
  certificateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  certificateType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: 'white',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  topicsCompleted: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  topicListHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  topicCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#455A64',
  },
  topicDescription: {
    fontSize: 14,
    color: '#607D8B',
    marginTop: 5,
    marginBottom: 10,
  },
  topicStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  completedText: {
    fontSize: 14,
    color: '#4fe0be',
    marginLeft: 5,
  },
  incompleteText: {
    fontSize: 14,
    color: '#78909C',
    marginLeft: 5,
  },
  viewButton: {
    backgroundColor: 'rgba(79, 224, 190, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  viewButtonText: {
    color: '#4fe0be',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#455A64',
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#78909C',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#455A64',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  requirementText: {
    fontSize: 14,
    color: '#607D8B',
    flex: 1,
  },
  backLinkContainer: {
    alignItems: 'center',
    marginVertical: 25,
  },
  backButton: {
    width: '90%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4fe0be',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4fe0be',
  },
  retryButtonText: {
    color: '#4fe0be',
    fontSize: 16,
  },
}); 