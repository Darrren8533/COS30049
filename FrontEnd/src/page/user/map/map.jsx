import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './map.css';
import Navbar from '../../../components/navbar/navbar';
import Footer from '../../../components/footer/footer';

import cafeIcon_001 from '../../../assets/Cafe_001.jpg';
import exhibitIcon_001 from '../../../assets/Exhibit_001.jpg';
import entranceIcon_001 from '../../../assets/Entrance_001.jpg';
import orangutanIcon_001 from '../../../assets/OrangUtan_001.jpg';
import buildingIcon_001 from '../../../assets/Centre_001.jpg';
import busIcon_001 from '../../../assets/Bus_001.jpg';

import cafeIcon_002 from '../../../assets/Cafe_002.jpg';
import exhibitIcon_002 from '../../../assets/Exhibit_002.jpg';
import entranceIcon_002 from '../../../assets/Entrance_002.jpg';
import orangutanIcon_002 from '../../../assets/OrangUtan_002.jpg';
import buildingIcon_002 from '../../../assets/Centre_002.jpg';
import busIcon_002 from '../../../assets/Bus_002.jpg';

import cafeIcon_003 from '../../../assets/Cafe_003.jpg';
import exhibitIcon_003 from '../../../assets/Exhibit_003.jpg';
import entranceIcon_003 from '../../../assets/Entrance_003.jpg';
// import orangutanIcon_003 from '../../../assets/OrangUtan_003.jpg';
import buildingIcon_003 from '../../../assets/Centre_003.jpg';
import busIcon_003 from '../../../assets/Bus_003.jpg';

import cafeIcon_004 from '../../../assets/Cafe_004.jpg';
import exhibitIcon_004 from '../../../assets/Exhibit_004.jpg';
// import entranceIcon_004 from '../../../assets/Entrance_004.jpg';
// import orangutanIcon_004 from '../../../assets/OrangUtan_004.jpg';
// import buildingIcon_004 from '../../../assets/Centre_004.jpg';
// import busIcon_004 from '../../../assets/Bus_004.jpg';


// Fix for default icon issue in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for points of interest
const createCustomIcon = (iconUrl, size = [32, 32]) => {
  return L.icon({
    iconUrl,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]], // Bottom center of the icon
    popupAnchor: [0, -size[1]], // Top center of the icon
  });
};

// Define custom icons
const cafeIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/128/9620/9620771.png');
const exhibitionIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/128/2400/2400560.png');
const entranceIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/128/18408/18408408.png');
const orangutanIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/128/1998/1998721.png');
const buildingIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/512/619/619034.png');
const busIcon = createCustomIcon('https://cdn-icons-png.flaticon.com/128/1068/1068580.png');

// Custom component to handle location changes and map view
function LocationMarker() {
  const [position, setPosition] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const map = useMap();
  const watchIdRef = useRef(null);

  // Semenggoh Wildlife Centre coordinates
  const semenggohLocation = [1.400152351314101, 110.32473248855071];

  useEffect(() => {
    // Start tracking automatically when component mounts
    startLocationTracking();
    
    // Clean up function to stop tracking when component unmounts
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Function to start real-time location tracking
  const startLocationTracking = () => {
    setIsTracking(true);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsTracking(false);
      return;
    }
    
    // Clear any existing watch
    stopLocationTracking();
    
    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        
        // Only fly to location on first position or if user clicks the button
        if (!position) {
          map.flyTo([latitude, longitude], 16);
        }
        
        setLocationError(null);
      },
      (error) => {
        setLocationError(`Error tracking location: ${error.message}`);
        setIsTracking(false);
      },
      { 
        enableHighAccuracy: true, // Higher accuracy
        timeout: 10000,           // 10 seconds timeout
        maximumAge: 0             // Don't use cached position
      }
    );
  };
  
  // Function to stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };
  
  // Function to center map on current location
  const centerOnLocation = () => {
    if (position) {
      map.flyTo(position, 16);
    } else {
      startLocationTracking();
    }
  };

  // Function to center map on Semenggoh Wildlife Centre
  const centerOnSemenggoh = () => {
    map.flyTo(semenggohLocation, 16);
  };

  return (
    <>
      {locationError && (
        <div className="location-error">
          <p>{locationError}</p>
          <button onClick={startLocationTracking}>Try Again</button>
        </div>
      )}
      
      <div className="locate-button-container">
        <button 
          className="locate-button semenggoh-button" 
          onClick={centerOnSemenggoh}
        >
          Find Semenggoh Location
        </button>
        <button 
          className={`locate-button ${isTracking ? 'tracking' : ''}`} 
          onClick={centerOnLocation}
        >
          {isTracking ? 'Location Tracking Active' : 'Find My Location'}
        </button>
      </div>
      
      {position && (
        <Marker position={position}>
          <Popup>
            <div>
              <h3>You are here</h3>
              <p>Latitude: {position[0].toFixed(6)}</p>
              <p>Longitude: {position[1].toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

// Custom marker component that updates selected POI on click
function InteractiveMarker({ poi, setSelectedPoi }) {
  const map = useMap();
  
  const handleMarkerClick = () => {
    // Create a copy of the poi object to ensure all properties are preserved
    const poiCopy = {
      id: poi.id,
      position: poi.position, 
      name: poi.name || "Location Point", // Provide default if name is missing
      description: poi.description || "",
      icon: poi.icon,
      additionalInfo: poi.additionalInfo || "",
      images: poi.images || []
    };
    
    setSelectedPoi(poiCopy);
    // Optionally close any open popups
    map.closePopup();
  };

  return (
    <Marker 
      position={poi.position} 
      icon={poi.icon}
      eventHandlers={{
        click: handleMarkerClick,
      }}
    >
      <Popup className="custom-popup">
        <div className="poi-popup">
          <h3>{poi.name || "Location Point"}</h3>
          <p><strong>{poi.description}</strong></p>
          <p>{poi.additionalInfo}</p>
        </div>
      </Popup>
    </Marker>
  );
}

const MapPage = () => {
  // Default map center (will be updated when user location is available)
  // Sarawak, Malaysia coordinates as default
  const [defaultCenter] = useState([1.5533, 110.3592]);
  
  // State to track selected point of interest
  const [selectedPoi, setSelectedPoi] = useState(null);
  
  // State for fullscreen image modal
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  // Reference to the map instance
  const mapRef = useRef(null);
  
  // Function to save map reference when map is created
  const handleMapCreated = (map) => {
    mapRef.current = map;
  };
  
  // Function to flyTo selected POI
  const flyToPoi = (position) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 18);
    }
  };
  
  // Points of interest data with custom icons
  const pointsOfInterest = [
    {
      id: 1,
      position: [1.400152351314101, 110.32473248855071],
      name: "Semenggoh Park Entrance",
      description: "Semenggoh Park Entrance",
      icon: entranceIcon,
      additionalInfo: "Semenggoh Park Entrance",
      images: [
        {
          url: entranceIcon_001,
          caption: "Semenggoh Park Entrance"
        },
        {
          url: entranceIcon_002,
          caption: "Semenggoh Park Entrance"
        },
        {
          url: entranceIcon_003,
          caption: "Semenggoh Park Entrance"
        }
      ]
    },
    {
      id: 2,
      position: [1.3998087942710848, 110.32439571060347],
      name: "Semenggoh Park Visitor Centre",
      description: "Information and tickets",
      icon: buildingIcon,
      additionalInfo: "Get your tickets here. Local guides available for hire.",
      images: [
        {
          url: buildingIcon_001,
          caption: "Main entrance to the visitor center"
        },
        {
          url: buildingIcon_002,
          caption: "Information desk"
        },
        {
          url: buildingIcon_003,
          caption: "Main entrance to the visitor center"
        }
      ]
    },
    {
      id: 3,
      position: [1.40126, 110.31652],
      name: "Semenggoh Cafe",
      description: "Semenggoh Cafe",
      icon: cafeIcon,
      additionalInfo: "Semenggoh Cafe",
      images: [
        {
          url: cafeIcon_001,
          caption: "Semenggoh Cafe"
        },
        {
          url: cafeIcon_002,
          caption: "Semenggoh Cafe"
        },
        {
          url: cafeIcon_003,
          caption: "Semenggoh Cafe"
        },
        {
          url: cafeIcon_004,
          caption: "Semenggoh Cafe"
        }
      ]
    },
    {
      id: 4,
      position: [1.4013, 110.31546],
      name: "Exhibition Centre",
      description: "Exhibition Centre",
      icon: exhibitionIcon,
      additionalInfo: "Exhibition Centre",
      images: [
        {
          url: exhibitIcon_001,
          caption: "Exhibition Centre"
        },
        {
          url: exhibitIcon_002,
          caption: "Exhibition Centre"
        },
        {
          url: exhibitIcon_003,
          caption: "Exhibition Centre"
        },
        {
          url: exhibitIcon_004,
          caption: "Exhibition Centre"
        }
      ]
    },
    {
      id: 5,
      position: [1.4015, 110.3151],
      name: "Tour Bus",
      description: "Tour bus service",
      icon: busIcon,
      additionalInfo: "Wheelchair accessible facilities available.",
      images: [
        {
          url: busIcon_001,
          caption: "Tour bus station entrance"
        },
        {
          url: busIcon_002,
          caption: "Tour bus parking area"
        },
        {
          url: busIcon_003,
          caption: "Tour bus service information"
        }
      ]
    },
    {
      id: 6,
      position: [1.4018, 110.3148],
      name: "Orangutan Rehabilitation Centre",
      description: "Orangutan rehabilitation centre",
      icon: orangutanIcon,
      additionalInfo: "Orangutan rehabilitation centre",
      images: [
        {
          url: orangutanIcon_001,
          caption: "Orangutan in its natural habitat"
        },
        {
          url: orangutanIcon_002,
          caption: "Orangutan in its natural habitat"
        }
      ]
    }
  ];
  
  // Handle reset of selected POI when clicking elsewhere on map
  function MapClicker({ setSelectedPoi }) {
    useMapEvents({
      click: () => {
        setSelectedPoi(null);
      },
    });
    return null;
  }
  
  return (
    <div className="map-page">
      {/* Apply Navbar */}
      <Navbar />
      
      {/* Hero Section */}
      <section className="map-hero">
        <div className="map-hero-content">
          <h1>Interactive Park Map</h1>
          <p>Explore Semenggoh Wildlife Centre with real-time location tracking</p>
        </div>
      </section>
      
      <div className="map-container">
        <div className="map-section">
          <h2>Explore the Park</h2>
          
          <div className="map-legend">
            <h3>Map Legend</h3>
            <ul>
              <li><img src="https://cdn-icons-png.flaticon.com/128/18408/18408408.png" alt="Entrance" /> Entrance</li>
              <li><img src="https://cdn-icons-png.flaticon.com/512/619/619034.png" alt="Building" /> Visitor Centre</li>
              <li><img src="https://cdn-icons-png.flaticon.com/128/9620/9620771.png" alt="Food" /> Cafe</li>
              <li><img src="https://cdn-icons-png.flaticon.com/128/2400/2400560.png" alt="Exhibition" /> Exhibition Centre</li>
              <li><img src="https://cdn-icons-png.flaticon.com/128/1068/1068580.png" alt="Bus" /> Tour Bus</li>
              <li><img src="https://cdn-icons-png.flaticon.com/128/1998/1998721.png" alt="Monkey" /> Wildlife</li>
            </ul>
          </div>
          
          <MapContainer 
            center={defaultCenter} 
            zoom={15}
            whenCreated={handleMapCreated}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LocationMarker />
            <MapClicker setSelectedPoi={setSelectedPoi} />
            
            {/* Render all points of interest with custom icons */}
            {pointsOfInterest.map(poi => (
              <InteractiveMarker 
                key={poi.id} 
                poi={poi} 
                setSelectedPoi={setSelectedPoi}
              />
            ))}
          </MapContainer>
        </div>
        
        {/* Selected POI details card */}
        {selectedPoi && (
          <div className="poi-details-card">
            <div className="poi-details-header">
              <h2>{selectedPoi.name || "Location Point"}</h2>
              <button className="close-button" onClick={() => setSelectedPoi(null)}>×</button>
            </div>
            
            <div className="poi-details-content">
              <PhotoGallery 
                images={selectedPoi.images || []} 
                setFullscreenImage={setFullscreenImage}
              />
              
              <div className="poi-info">
                {selectedPoi.description && (
                  <p className="poi-description"><strong>{selectedPoi.description}</strong></p>
                )}
                {selectedPoi.additionalInfo && (
                  <p className="poi-additional-info">{selectedPoi.additionalInfo}</p>
                )}
                <div className="poi-location">
                  <strong>Location: </strong>
                  <span>Latitude: {selectedPoi.position[0].toFixed(6)}, Longitude: {selectedPoi.position[1].toFixed(6)}</span>
                </div>
                {/* <button className="visit-button" onClick={() => flyToPoi(selectedPoi.position)}>
                  Visit This Location
                </button> */}
              </div>
            </div>
          </div>
        )}
        
        {/* Fullscreen image modal */}
        {fullscreenImage && (
          <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
            <div className="fullscreen-modal-content">
              <img src={fullscreenImage.url} alt={fullscreenImage.caption || "Fullscreen view"} />
              {fullscreenImage.caption && (
                <p className="fullscreen-caption">{fullscreenImage.caption}</p>
              )}
              <button className="fullscreen-close-button" onClick={() => setFullscreenImage(null)}>×</button>
            </div>
          </div>
        )}
        
        <div className="map-info">
          <h2>About the Map</h2>
          <p>This interactive map shows your current location in real-time and important landmarks in the park.</p>
          <p>Your location is automatically tracked as you move. Click on "Location Tracking Active" to center the map on your current position.</p>
          <p>Click on any icon to view detailed information and photos below the map.</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Photo Gallery Component with navigation buttons
function PhotoGallery({ images, setFullscreenImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  
  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
    setDirection('prev');
    setCurrentIndex(newIndex);
  };
  
  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setDirection('next');
    setCurrentIndex(newIndex);
  };
  
  const handleImageClick = (image) => {
    setFullscreenImage(image);
  };
  
  // If there are no images, return null
  if (!images || images.length === 0) {
    return null;
  }
  
  // If there's only one image, just show it without navigation
  if (images.length === 1) {
    return (
      <div className="poi-single-image">
        <div className="poi-image-container">
          <img 
            src={images[0].url} 
            alt="Location" 
            onClick={() => handleImageClick(images[0])}
            className="clickable-image"
          />
          <p className="image-caption">{images[0].caption}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="poi-image-gallery">
      <button className="gallery-nav-button prev" onClick={goToPrevious}>
        &#10094;
      </button>
      
      <div className="poi-image-container">
        <img 
          src={images[currentIndex].url} 
          alt="Location" 
          className={`${direction === 'next' ? 'next-image' : 'prev-image'} clickable-image`}
          onClick={() => handleImageClick(images[currentIndex])}
        />
        <p className="image-caption">{images[currentIndex].caption}</p>
        <div className="image-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      <button className="gallery-nav-button next" onClick={goToNext}>
        &#10095;
      </button>
    </div>
  );
}

export default MapPage;
