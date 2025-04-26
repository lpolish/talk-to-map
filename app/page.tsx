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
        positionClassName="right-5 top-20"
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
        className={`absolute bottom-5 left-5 p-4 rounded-xl shadow-lg backdrop-blur-lg z-10 ${
          isDarkMode 
            ? 'bg-gray-800/90 text-gray-100 border border-gray-700/40'
            : 'bg-white/90 text-gray-800 border border-gray-200/60'
        }`}
        style={{ 
          maxWidth: '320px', 
          backdropFilter: 'blur(20px)',
          boxShadow: isDarkMode 
            ? '0 10px 30px rgba(0, 0, 0, 0.4)' 
            : '0 10px 30px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke={isDarkMode ? "white" : "#4b5563"} strokeWidth="2"/>
            <path d="M15 9.5C15 11.9853 12 16 12 16C12 16 9 11.9853 9 9.5C9 7.01472 10.3431 5 12 5C13.6569 5 15 7.01472 15 9.5Z" 
              stroke={isDarkMode ? "white" : "#4b5563"} strokeWidth="2"/>
            <path d="M12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10Z" 
              fill={isDarkMode ? "white" : "#4b5563"}/>
          </svg>
          <h3 className={`font-semibold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Current Location
          </h3>
        </div>
        <div 
          className={`mb-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}
        >
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {mapState.locationName || 'Unknown location'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
            <p className={`text-xs uppercase font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Coordinates
            </p>
            <p className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {mapState.center.lat.toFixed(6)}
            </p>
            <p className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {mapState.center.lng.toFixed(6)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
            <p className={`text-xs uppercase font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Zoom Level
            </p>
            <div className="flex items-center">
              <span className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {mapState.zoom.toFixed(1)}
              </span>
              <span className={`text-xs ml-1 mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                / 18.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
