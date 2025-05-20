import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  SafeAreaView, 
  StatusBar, 
  Animated, 
  Dimensions, 
  View as RNView,
  TouchableOpacityProps,
  Pressable,
  Modal
} from 'react-native';
import { Text, View } from '../../components/Themed';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Get window dimensions for responsive design
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Must-see spots with high-quality open source images
const spots = [
  {
    id: '1',
    name: 'Orangutan Feeding Platform',
    image: 'https://images.unsplash.com/photo-1570267866037-47c68ddb41fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80',
    info: 'Daily feeding sessions at 9AM & 3PM',
    icon: 'binoculars'
  },
  {
    id: '2',
    name: 'Main Rainforest Trail',
    image: 'https://images.unsplash.com/photo-1596306499317-8490232488a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    info: '1.6km trail through pristine jungle',
    icon: 'route'
  },
  {
    id: '3',
    name: 'Wildlife Viewpoint',
    image: 'https://images.unsplash.com/photo-1587163544666-9ad59eb4ae9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    info: 'Perfect spots for wildlife photography',
    icon: 'camera'
  },
  {
    id: '4',
    name: 'Conservation Centre',
    image: 'https://images.unsplash.com/photo-1544985361-b420d7a77043?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
    info: 'Learn about wildlife conservation',
    icon: 'book-reader'
  }
];

// Gallery images - expanded collection
const galleryImages = [
  'https://images.unsplash.com/photo-1544985361-b420d7a77043?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80',
  'https://images.unsplash.com/photo-1544983498-8c0aead97edb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1559&q=80',
  'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1591643305021-4ca0f58aadb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1552686268-62c4a9c87dc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80'
];

// Rainforest background options
const forestBackgrounds = [
  'https://images.unsplash.com/photo-1536147210925-5cb7a7a4f9fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1596123068611-c89d922a0f0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1597739239353-50270a473397?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80'
];

// Quick facts
const quickFacts = [
  {
    id: '1',
    title: 'Opening Hours',
    content: '8:00AM - 4:00PM Daily',
    icon: 'time'
  },
  {
    id: '2',
    title: 'Location',
    content: '24km from Kuching City',
    icon: 'location'
  },
  {
    id: '3',
    title: 'Best Time',
    content: 'Feeding sessions at 9AM & 3PM',
    icon: 'calendar'
  }
];

export default function HomeScreen() {
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State for interactive elements
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  // Switch hero background periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % forestBackgrounds.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, []);

  // Parallax effect for hero image
  const heroImageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [0, 0, 0],
    extrapolate: 'clamp',
  });

  // Animation for fade-in and scale-up
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Open image in modal
  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Full-screen image modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <RNView style={styles.modalContainer}>
          <Pressable 
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="white" />
          </Pressable>
          <Image 
            source={{ uri: modalImage }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </RNView>
      </Modal>
      
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section with Parallax Effect */}
        <RNView style={styles.heroContainer}>
          <Animated.View
            style={[
              styles.heroImage,
              {
                transform: [{ translateY: heroImageTranslateY }],
              },
            ]}
          >
            <ImageBackground 
              source={{ uri: forestBackgrounds[backgroundIndex] }}
              style={styles.heroImageBg}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.appTitle}>SEMENGGOH</Text>
            <Text style={styles.heroTitle}>Wildlife Centre</Text>
            <Text style={styles.heroSubtitle}>
              Experience orangutans in their natural habitat
            </Text>
            
            <TouchableOpacity 
              style={styles.exploreButton}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Plan Your Visit</Text>
              <Ionicons name="arrow-forward" size={18} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
          </Animated.View>
        </RNView>

        {/* Quick Facts Section */}
        <View style={styles.quickFactsContainer}>
          {quickFacts.map((fact) => (
            <RNView key={fact.id} style={styles.factCard}>
              <Ionicons name={fact.icon as any} size={24} color="#4CAF50" />
              <Text style={styles.factTitle}>{fact.title}</Text>
              <Text style={styles.factContent}>{fact.content}</Text>
            </RNView>
          ))}
        </View>
        
        {/* Must-See Spots */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Must-See Spots</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsContainer}
          >
            {spots.map((spot) => (
              <Pressable 
                key={spot.id}
                style={({pressed}) => [
                  styles.spotCard,
                  {transform: [{ scale: pressed ? 0.98 : 1 }]}
                ]}
              >
                <Image 
                  source={{ uri: spot.image }} 
                  style={styles.spotImage}
                />
                <RNView style={styles.spotContent}>
                  <RNView style={styles.spotHeader}>
                    <FontAwesome5 name={spot.icon} size={16} color="#4CAF50" />
                    <Text style={styles.spotName}>{spot.name}</Text>
                  </RNView>
                  <Text style={styles.spotInfo}>{spot.info}</Text>
                </RNView>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Photo Gallery */}
        <View style={styles.sectionContainer}>
          <RNView style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </RNView>
          
          <RNView style={styles.galleryContainer}>
            {galleryImages.map((image, index) => (
              <Pressable 
                key={index}
                style={({pressed}) => [
                  styles.galleryItem,
                  {opacity: pressed ? 0.8 : 1}
                ]}
                onPress={() => openImageModal(image)}
              >
                <Image 
                  source={{ uri: image }} 
                  style={[
                    styles.galleryImage,
                    selectedImage === index && styles.galleryImageSelected
                  ]}
                />
              </Pressable>
            ))}
          </RNView>
        </View>

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <Text style={styles.sectionTitle}>About the Centre</Text>
          <Text style={styles.aboutText}>
            Established in 1975, Semenggoh is Sarawak's renowned orangutan rehabilitation centre. 
            We provide care for injured and orphaned orangutans, helping them return to the wild.
          </Text>
          <Text style={styles.aboutText}>
            Today, the centre focuses on studying orangutan biology and behavior while providing 
            a natural haven for semi-wild orangutans. Visiting offers a unique opportunity to observe 
            these remarkable animals in their natural habitat.
          </Text>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1459478309853-2c33a60058e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1473&q=80' }}
            style={styles.ctaImage}
            resizeMode="cover"
          >
            <RNView style={styles.ctaOverlay}>
              <Text style={styles.ctaTitle}>Protect Orangutans</Text>
              <Text style={styles.ctaSubtitle}>Join our conservation efforts</Text>
              
              <TouchableOpacity 
                style={styles.ctaButton}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaButtonText}>Support Now</Text>
              </TouchableOpacity>
            </RNView>
          </ImageBackground>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroContainer: {
    height: windowHeight * 0.6,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: windowHeight * 0.6,
  },
  heroImageBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
    color: 'white',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  quickFactsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: -30,
    zIndex: 10,
    borderRadius: 12,
  },
  factCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  factTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  factContent: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  aboutContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  aboutText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  spotsContainer: {
    paddingRight: 20,
  },
  spotCard: {
    width: windowWidth * 0.65,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  spotImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  spotContent: {
    padding: 16,
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  spotInfo: {
    fontSize: 13,
    color: '#666',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  galleryImageSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  ctaContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ctaImage: {
    width: '100%',
    height: '100%',
  },
  ctaOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: windowWidth,
    height: windowHeight * 0.7,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
