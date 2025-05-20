import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

interface Topic {
  id: number;
  title: string;
  certification: string;
  certificationLink: string;
  description: string;
  materials: Material[];
  quiz: Quiz | null;
}

interface Material {
  id: number;
  title: string;
  size: string;
  type: string;
  uploadDate: string;
}

interface Quiz {
  title: string;
  questionCount: number;
  passingScore: string;
  timeLimit: number;
}

export default function TopicScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const host = Constants.expoConfig?.extra?.host;
  
  // Default topic data
  const [topic, setTopic] = useState<Topic>({
    id: 0,
    title: '',
    certification: '',
    certificationLink: '',
    description: '',
    materials: [],
    quiz: null
  });
  
  // Fetch topic data
  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://${host}:3000/api/topics/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch topic details');
        }
        
        if (data.success) {
          setTopic(data.topic);
        } else {
          throw new Error(data.message || 'Failed to fetch topic details');
        }
      } catch (error: any) {
        console.error('Error fetching topic details:', error);
        setError(error.message || 'Failed to fetch topic details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTopicDetails();
    }
  }, [id]);
  
  // Navigation
  const handleBack = () => {
    router.back();
  };
  
  // Download material
  const handleDownloadMaterial = (materialId: number) => {
    // In a real app, you would implement download functionality here
    alert(`Downloading material ${materialId}...`);
  };
  
  // Take quiz
  const handleTakeQuiz = () => {
    if (topic.quiz) {
      router.push(`/quiz/${id}`);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Topic Details' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4fe0be" />
          <Text style={styles.loadingText}>Loading topic details...</Text>
        </View>
      </View>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Topic Details' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.replace(`/topic/${id}`)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: topic.title
        }} 
      />
      
      <LinearGradient
        colors={['#4fe0be', '#23a08d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.certificationName}>
          {topic.certification}
        </Text>
      </LinearGradient>
      
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{topic.description}</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Materials</Text>
        {topic.materials.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No materials available</Text>
          </View>
        ) : (
          <View style={styles.materialsContainer}>
            {topic.materials.map(material => (
              <View key={material.id} style={styles.materialCard}>
                <View style={styles.materialIcon}>
                  <Ionicons 
                    name={material.type === 'pdf' ? 'document' : material.type === 'video' ? 'videocam' : 'document-text'} 
                    size={24} 
                    color="#4fe0be" 
                  />
                </View>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle}>{material.title}</Text>
                  <Text style={styles.materialMeta}>
                    {material.type.toUpperCase()} • {material.size} • {material.uploadDate}
                  </Text>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download" size={20} color="#4fe0be" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        {topic.quiz && (
          <>
            <Text style={styles.sectionTitle}>Quiz</Text>
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>{topic.quiz.title}</Text>
              <View style={styles.quizInfoRow}>
                <View style={styles.quizInfoItem}>
                  <Ionicons name="help-circle" size={20} color="#4fe0be" />
                  <Text style={styles.quizInfoText}>
                    {topic.quiz.questionCount} Questions
                  </Text>
                </View>
                <View style={styles.quizInfoItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4fe0be" />
                  <Text style={styles.quizInfoText}>
                    Passing: {topic.quiz.passingScore}
                  </Text>
                </View>
                <View style={styles.quizInfoItem}>
                  <Ionicons name="time-outline" size={20} color="#4fe0be" />
                  <Text style={styles.quizInfoText}>
                    {topic.quiz.timeLimit} Minutes
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.takeQuizButton}
                onPress={handleTakeQuiz}
              >
                <Text style={styles.takeQuizButtonText}>
                  Take Quiz
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 10
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  backButton: {
    paddingVertical: 12
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16
  },
  header: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  certificationName: {
    fontSize: 14,
    color: '#e6f7f4',
    marginTop: 4
  },
  contentContainer: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444'
  },
  emptyState: {
    padding: 20,
    alignItems: 'center'
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14
  },
  materialsContainer: {
    marginBottom: 20
  },
  materialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  materialIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    borderRadius: 8
  },
  materialInfo: {
    flex: 1,
    marginLeft: 12
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  materialMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  quizInfoRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  quizInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  quizInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  takeQuizButton: {
    backgroundColor: '#4fe0be',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  takeQuizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 