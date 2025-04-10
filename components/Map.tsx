import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { MapProps, Coordinates, MapState, MapType } from '../types/map';
import { reverseGeocode } from '../utils/geocoding';

// Define exported map ref type
export interface MapRef {
  navigateTo: (coordinates: Coordinates, zoom?: number) => void;
  setMapType: (type: MapType) => void;
}

const Map = forwardRef<MapRef, MapProps>(({ 
  initialCenter = { lat: 40.7128, lng: -74.0060 }, // Default to New York City
  initialZoom = 13,
  initialMapType = 'standard',
  onMapStateChange 
}, ref) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapStateRef = useRef<MapState>({
    center: initialCenter,
    zoom: initialZoom,
    mapType: initialMapType
  });
  const [mapState, setMapState] = useState<MapState>({
    center: initialCenter,
    zoom: initialZoom,
    mapType: initialMapType
  });
  const tileLayersRef = useRef<Record<MapType, any> | null>(null);

  // Update ref when state changes
  useEffect(() => {
    mapStateRef.current = mapState;
  }, [mapState]);

  // Load map only once when component mounts
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;
    
    // Clean up function (runs when component unmounts)
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, []);

  // Initialize map with separate effect to ensure it runs only once
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    const initializeMap = async () => {
      try {
        // Prevent double initialization
        if (mapRef.current) return;
        
        // Ensure container exists
        if (!mapContainerRef.current) return;
        
        // Dynamically import Leaflet
        const leaflet = await import('leaflet');
        
        // Add CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const linkEl = document.createElement('link');
          linkEl.rel = 'stylesheet';
          linkEl.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(linkEl);
        }
        
        // Fix Leaflet default icon issue
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        // Create map instance with more granular zoom
        const map = leaflet.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: initialZoom,
          zoomControl: true,
          doubleClickZoom: false,
          scrollWheelZoom: true,
          dragging: true,
          // Disable animations but keep zooming responsive
          fadeAnimation: false,
          zoomAnimation: false,
          markerZoomAnimation: false,
          // More granular zoom settings
          zoomSnap: 0.5,      // Allow half zoom levels
          zoomDelta: 0.5,     // Changed from default 1 to 0.5 for more granular zooming
          wheelPxPerZoomLevel: 80, // Adjusted for more gradual wheel zoom
          wheelDebounceTime: 40,   // Slightly increased for better control
          // Bounds control
          minZoom: 3, 
          maxZoom: 18
        });
        
        // Define tile layers for different map types
        const tileLayers: Record<MapType, any> = {
          standard: leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }),
          satellite: leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }),
          relief: leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
          }),
          dark: leaflet.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
          })
        };
        
        // Store tile layers for later use
        tileLayersRef.current = tileLayers;
        
        // Add the initial tile layer
        tileLayers[initialMapType].addTo(map);
        
        // Store map reference
        mapRef.current = map;
        
        // Track if we're currently processing a state change
        let isProcessingChange = false;
        
        // Set up basic event handlers with minimal processing
        const handleStateChange = () => {
          if (!mounted || !map) return;
          
          // Skip if already processing another change
          if (isProcessingChange) return;
          isProcessingChange = true;
          
          try {
            const center = map.getCenter();
            if (!center) {
              isProcessingChange = false;
              return;
            }
            
            const newCenter = { lat: center.lat, lng: center.lng };
            const zoom = map.getZoom(); // Don't round for more granular zoom
            const currentState = mapStateRef.current;
            
            // Only update if position actually changed
            const locationChanged = 
              Math.abs(newCenter.lat - currentState.center.lat) > 0.001 || 
              Math.abs(newCenter.lng - currentState.center.lng) > 0.001 ||
              Math.abs(zoom - currentState.zoom) >= 0.1; // More precise comparison for granular zoom
              
            if (locationChanged) {
              // Immediately update the state with current position and zoom
              // This makes UI feel more responsive
              const intermediateState = { 
                ...currentState,
                center: newCenter, 
                zoom
              };
              
              setMapState(intermediateState);
              
              // Get location name asynchronously
              reverseGeocode(newCenter)
                .then(locationName => {
                  if (!mounted) return;
                  
                  const newState = { 
                    ...currentState,
                    center: newCenter, 
                    zoom, 
                    locationName 
                  };
                  
                  setMapState(newState);
                  
                  if (onMapStateChange) {
                    onMapStateChange(newState);
                  }
                })
                .catch(err => {
                  console.error('Error getting location name:', err);
                  
                  // Only call onMapStateChange once with current locationName
                  if (onMapStateChange) {
                    onMapStateChange({ 
                      ...currentState,
                      center: newCenter, 
                      zoom, 
                      locationName: currentState.locationName 
                    });
                  }
                })
                .finally(() => {
                  isProcessingChange = false;
                });
            } else {
              isProcessingChange = false;
            }
          } catch (err) {
            console.error('Error handling map state change:', err);
            isProcessingChange = false;
          }
        };
        
        // Add event listeners for map movement
        map.on('moveend', handleStateChange);
        map.on('zoomend', handleStateChange);
        
        // Immediately respond to zoom starts for better UX
        map.on('zoomstart', () => {
          try {
            const zoom = map.getZoom(); // Don't round for more granular zoom
            const center = map.getCenter();
            
            if (center && Math.abs(zoom - mapStateRef.current.zoom) >= 0.1) {
              setMapState(prev => ({
                ...prev,
                zoom
              }));
            }
          } catch (err) {
            console.error('Error handling zoom start:', err);
          }
        });
        
        // Process wheel events directly for immediate feedback
        map.on('wheel', (e: any) => {
          try {
            // Skip if disabled or meta key pressed
            if (!map.options.scrollWheelZoom || e.metaKey || e.ctrlKey) return;
            
            // Update UI immediately on wheel, before the actual zoom completes
            setTimeout(() => {
              if (mounted && map) {
                const zoom = map.getZoom(); // Don't round for more granular zoom
                if (Math.abs(zoom - mapStateRef.current.zoom) >= 0.1) {
                  setMapState(prev => ({
                    ...prev,
                    zoom
                  }));
                }
              }
            }, 0);
          } catch (err) {
            console.error('Error handling wheel event:', err);
          }
        });
        
        // Handle initial location name lookup
        reverseGeocode(initialCenter)
          .then(locationName => {
            if (!mounted) return;
            
            const newState = { 
              ...mapStateRef.current,
              center: initialCenter, 
              zoom: initialZoom,
              locationName 
            };
            
            setMapState(newState);
            
            if (onMapStateChange) {
              onMapStateChange(newState);
            }
          })
          .catch(err => {
            console.error('Error getting initial location name:', err);
          });
          
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    
    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [initialCenter, initialZoom, initialMapType, onMapStateChange]);

  // Simple navigation method that avoids animations
  const navigateTo = (coordinates: Coordinates, zoom?: number) => {
    if (!mapRef.current) return;
    
    try {
      // Use exact zoom value if provided, otherwise use current zoom
      const targetZoom = zoom !== undefined ? zoom : mapState.zoom;
      
      // Use simple setView without animations
      mapRef.current.setView([coordinates.lat, coordinates.lng], targetZoom, {
        animate: false,
        duration: 0
      });
      
      // Immediately update the state with new position and zoom
      // This makes UI feel more responsive
      setMapState(prev => ({
        ...prev,
        center: coordinates,
        zoom: targetZoom
      }));
      
      // Update location name asynchronously
      reverseGeocode(coordinates)
        .then(locationName => {
          const newState = { 
            ...mapState,
            center: coordinates, 
            zoom: targetZoom,
            locationName 
          };
          
          setMapState(newState);
          
          if (onMapStateChange) {
            onMapStateChange(newState);
          }
        })
        .catch(error => {
          console.error('Error getting location name:', error);
        });
    } catch (error) {
      console.error('Error navigating to location:', error);
    }
  };

  // Method to change the map type
  const setMapType = (mapType: MapType) => {
    if (!mapRef.current || !tileLayersRef.current) return;
    
    try {
      const map = mapRef.current;
      const tileLayers = tileLayersRef.current;
      
      // Remove all tile layers
      Object.values(tileLayers).forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      
      // Add the selected tile layer
      tileLayers[mapType].addTo(map);
      
      // Update state with new map type
      setMapState(prev => ({
        ...prev,
        mapType
      }));
      
      // Notify parent of map state change
      if (onMapStateChange) {
        onMapStateChange({
          ...mapState,
          mapType
        });
      }
    } catch (error) {
      console.error('Error changing map type:', error);
    }
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    navigateTo,
    setMapType
  }), []);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full absolute inset-0 z-0"
      data-testid="map-container"
      id="map-container"
      style={{ backgroundColor: '#f2f2f2' }}
    />
  );
});

Map.displayName = 'Map';

export default Map; 