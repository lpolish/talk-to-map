'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapState, Coordinates, MapType } from '../types/map';
import { MapRef } from '../components/Map';

// Dynamically import the components with no SSR
// This is necessary because Leaflet uses browser APIs
const MapWithNoSSR = dynamic(
  () => import('../components/Map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Loading map...</div>
      </div>
    )
  }
);

const ChatWindowWithNoSSR = dynamic(
  () => import('../components/ChatWindow'),
  { 
    ssr: false,
    loading: () => null // No loading state for chat since it's secondary
  }
);

const MapTypeSelectorWithNoSSR = dynamic(
  () => import('../components/MapTypeSelector'),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function Home() {
  // State to track the current map state with initialized default values
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 40.7128, lng: -74.0060 }, // Default to New York City
    zoom: 13,
    mapType: 'standard' as MapType
  });
  
  // Ref to the map component for navigation
  const mapRef = useRef<MapRef>(null);
  
  // Handle map state changes
  const handleMapStateChange = (newState: MapState) => {
    setMapState(newState);
  };
  
  // Handle navigation from chat to map
  const handleNavigate = (coordinates: Coordinates, zoom?: number) => {
    if (mapRef.current) {
      mapRef.current.navigateTo(coordinates, zoom);
    }
  };

  // Handle map type change
  const handleMapTypeChange = (mapType: MapType) => {
    if (mapRef.current) {
      mapRef.current.setMapType(mapType);
    }
  };

  // Check if dark mode should be applied
  const isDarkMode = mapState.mapType === 'dark';

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Map Component */}
      <MapWithNoSSR
        ref={mapRef}
        initialCenter={mapState.center}
        initialZoom={mapState.zoom}
        initialMapType={mapState.mapType}
        onMapStateChange={handleMapStateChange}
      />
      
      {/* Chat Window Component */}
      <ChatWindowWithNoSSR
        currentMapState={mapState}
        onNavigate={handleNavigate}
        initialX={20}
        initialY={20}
        initialWidth={350}
        initialHeight={500}
      />

      {/* Map Type Selector */}
      <MapTypeSelectorWithNoSSR
        selectedType={mapState.mapType || 'standard'}
        onTypeChange={handleMapTypeChange}
      />

      {/* Map Info Overlay */}
      <div 
        className={`absolute bottom-5 left-5 p-3 rounded-lg shadow-md backdrop-blur-sm z-10 ${
          isDarkMode 
            ? 'bg-gray-800/85 text-gray-100 border border-gray-700/40'
            : 'bg-white/85 text-gray-800 border border-gray-200/60'
        }`}
        style={{ maxWidth: '300px', backdropFilter: 'blur(10px)' }}
      >
        <h3 className={`font-semibold mb-1 text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Current Location
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {mapState.locationName || 'Unknown location'}
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Lat: {mapState.center.lat.toFixed(6)}, Lng: {mapState.center.lng.toFixed(6)}
        </p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Zoom: {mapState.zoom.toFixed(1)}
        </p>
      </div>
    </main>
  );
}
