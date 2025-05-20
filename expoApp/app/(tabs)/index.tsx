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
import { router } from 'expo-router';

// Get window dimensions for responsive design
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Must-see spots with high-quality open source images
const spots = [
  {
    id: '1',
    name: 'Orangutan Feeding Platform',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsc6G3cm8KRGcAtVk6lUMPkXzU1J_aW_t6LQ&s',
    info: 'Daily feeding sessions at 9AM & 3PM',
    icon: 'binoculars'
  },
  {
    id: '2',
    name: 'Main Rainforest Trail',
    image: 'https://bestever.guide/wp-content/uploads/2021/10/Rainforest-Trail-Tofino-Vancouver-Island-scaled.jpg',
    info: '1.6km trail through pristine jungle',
    icon: 'route'
  },
  {
    id: '3',
    name: 'Wildlife Viewpoint',
    image: 'data:image/jpeg;base64,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',
    info: 'Perfect spots for wildlife photography',
    icon: 'camera'
  },
  {
    id: '4',
    name: 'Conservation Centre',
    image: 'https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2024/06/27/541b256403b320a92c7648530bb99232_1000x1000.jpg',
    info: 'Learn about wildlife conservation',
    icon: 'book-reader'
  }
];

// Gallery images - expanded collection
const galleryImages = [
  'https://travelsetu.com/apps/uploads/new_destinations_photos/destination/2024/06/27/541b256403b320a92c7648530bb99232_1000x1000.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsc6G3cm8KRGcAtVk6lUMPkXzU1J_aW_t6LQ&s',
  'https://traveloutlandish.com/wp-content/uploads/2019/03/Malaysia_Kuching_Semenggoh_Wildlife_Centre-59.jpg',
  'https://bestever.guide/wp-content/uploads/2021/10/Rainforest-Trail-Tofino-Vancouver-Island-scaled.jpg',
  'data:image/jpeg;base64,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',
  'https://borneoguru.com/wp-content/uploads/orang-utans-at-semenggoh-wildlife-centre.jpg'
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
              <Text style={styles.exploreButtonText} onPress={() => router.push('/(tabs)/park')}>Plan Your Visit</Text>
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
                <Text style={styles.ctaButtonText} onPress={() => router.push('/feedback')}>Support Now</Text>
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
