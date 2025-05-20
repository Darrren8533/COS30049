import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// 定义类型
interface Attraction {
  id: string;
  name: string;
  description: string;
  coordinate: { latitude: number; longitude: number };
  images: Array<{ uri: any; caption: string }>;
  additionalInfo?: string;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
}

// 景点数据
const attractions: Attraction[] = [
  {
    id: '1',
    name: 'Semenggoh Park Entrance',
    description: 'Semenggoh Park Entrance',
    coordinate: { latitude: 1.400152351314101, longitude: 110.32473248855071 },
    images: [
      { uri: require('../../assets/images/Entrance_001.jpg'), caption: 'Main Entrance' },
      { uri: require('../../assets/images/Entrance_002.jpg'), caption: 'Entrance View' },
      { uri: require('../../assets/images/Entrance_003.jpg'), caption: 'Entrance Sign' },
    ],
    additionalInfo: 'Main entrance to the park.'
  },
  {
    id: '2',
    name: 'Semenggoh Park Visitor Centre',
    description: 'Information and tickets',
    coordinate: { latitude: 1.3998087942710848, longitude: 110.32439571060347 },
    images: [
      { uri: require('../../assets/images/Centre_001.jpg'), caption: 'Visitor Centre' },
      { uri: require('../../assets/images/Centre_002.jpg'), caption: 'Information Desk' },
      { uri: require('../../assets/images/Centre_003.jpg'), caption: 'Centre Building' },
    ],
    additionalInfo: 'Get your tickets here. Local guides available for hire.'
  },
  {
    id: '3',
    name: 'Semenggoh Cafe',
    description: 'Cafe in the park',
    coordinate: { latitude: 1.40126, longitude: 110.31652 },
    images: [
      { uri: require('../../assets/images/Cafe_001.jpg'), caption: 'Cafe Entrance' },
      { uri: require('../../assets/images/Cafe_002.jpg'), caption: 'Cafe Interior' },
      { uri: require('../../assets/images/Cafe_003.jpg'), caption: 'Outdoor Seating' },
      { uri: require('../../assets/images/Cafe_004.jpg'), caption: 'Food Selection' },
    ],
    additionalInfo: 'Enjoy local food and drinks.'
  },
  {
    id: '4',
    name: 'Exhibition Centre',
    description: 'Exhibition Centre',
    coordinate: { latitude: 1.4013, longitude: 110.31546 },
    images: [
      { uri: require('../../assets/images/Exhibit_001.jpg'), caption: 'Exhibition Hall' },
      { uri: require('../../assets/images/Exhibit_002.jpg'), caption: 'Exhibition Display' },
      { uri: require('../../assets/images/Exhibit_003.jpg'), caption: 'Information Board' },
      { uri: require('../../assets/images/Exhibit_004.jpg'), caption: 'Exhibition Area' },
    ],
    additionalInfo: 'Learn about the park and wildlife.'
  },
  {
    id: '5',
    name: 'Tour Bus',
    description: 'Tour bus service',
    coordinate: { latitude: 1.4015, longitude: 110.3151 },
    images: [
      { uri: require('../../assets/images/Bus_001.jpg'), caption: 'Tour Bus' },
      { uri: require('../../assets/images/Bus_002.jpg'), caption: 'Bus Interior' },
      { uri: require('../../assets/images/Bus_003.jpg'), caption: 'Bus Station' },
    ],
    additionalInfo: 'Wheelchair accessible facilities available.'
  },
  {
    id: '6',
    name: 'Orangutan Rehabilitation Centre',
    description: 'Orangutan rehabilitation centre',
    coordinate: { latitude: 1.4018, longitude: 110.3148 },
    images: [
      { uri: require('../../assets/images/OrangUtan_001.jpg'), caption: 'Orangutan' },
      { uri: require('../../assets/images/OrangUtan_002.jpg'), caption: 'Orangutan in Tree' },
    ],
    additionalInfo: 'See orangutans in their natural habitat.'
  },
];

// 初始区域
const initialRegion: Region = {
  latitude: 1.400152351314101,
  longitude: 110.32473248855071,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function ParkMapNative() {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState<Region>(initialRegion);
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 获取定位权限和当前位置
  const handleLocateMe = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        alert('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const newLocation: LocationPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newLocation);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (e) {
      alert('Failed to get location');
    }
    setLocating(false);
  };

  // 选中景点时弹窗
  const handleMarkerPress = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setCurrentImageIndex(0);
    setModalVisible(true);
  };

  // 切换到下一张图片
  const nextImage = () => {
    if (selectedAttraction) {
      setCurrentImageIndex((prev) => 
        prev < selectedAttraction.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  // 切换到上一张图片
  const prevImage = () => {
    if (selectedAttraction) {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedAttraction.images.length - 1
      );
    }
  };

  // 关闭详情弹窗
  const closeModal = () => {
    setModalVisible(false);
    setSelectedAttraction(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {attractions.map(attraction => (
          <Marker
            key={attraction.id}
            coordinate={attraction.coordinate}
            title={attraction.name}
            description={attraction.description}
            onPress={() => handleMarkerPress(attraction)}
          />
        ))}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="#2e7d32"
          />
        )}
      </MapView>
      <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe} disabled={locating}>
        <Ionicons name="locate" size={22} color="#fff" />
        <Text style={styles.locateButtonText}>{locating ? 'Locating...' : 'Locate Me'}</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            {selectedAttraction && (
              <>
                <Text style={styles.modalTitle}>{selectedAttraction.name}</Text>
                <Text style={styles.modalDesc}>{selectedAttraction.description}</Text>
                
                {/* Image Gallery */}
                <View style={styles.imageGalleryContainer}>
                  {selectedAttraction.images.length > 1 && (
                    <TouchableOpacity style={styles.arrowButton} onPress={prevImage}>
                      <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.imageContainer}>
                    <Image
                      source={selectedAttraction.images[currentImageIndex].uri}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.imageCaption}>
                      {selectedAttraction.images[currentImageIndex].caption}
                    </Text>
                    
                    {selectedAttraction.images.length > 1 && (
                      <View style={styles.paginationDots}>
                        {selectedAttraction.images.map((_, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.paginationDot, 
                              index === currentImageIndex && styles.activeDot
                            ]} 
                          />
                        ))}
                      </View>
                    )}
                  </View>
                  
                  {selectedAttraction.images.length > 1 && (
                    <TouchableOpacity style={styles.arrowButton} onPress={nextImage}>
                      <Ionicons name="chevron-forward" size={26} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {selectedAttraction.additionalInfo && (
                  <Text style={styles.modalInfo}>{selectedAttraction.additionalInfo}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  locateButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 3,
    zIndex: 10,
  },
  locateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 24,
    minHeight: height * 0.35,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e3a59',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalImage: {
    width: width * 0.6,
    height: width * 0.4,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  modalInfo: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 6,
  },
  imageGalleryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 15,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    width: width * 0.6,
    height: width * 0.4,
  },
  arrowButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 8,
  },
  imageCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
}); 