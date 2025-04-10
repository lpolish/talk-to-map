import { Coordinates } from '../types/map';

export async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EarthAI/1.0',
          'Accept-Language': 'en',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    } else if (data.address) {
      // Attempt to build a more user-friendly location name
      const address = data.address;
      const parts = [];
      
      if (address.road || address.pedestrian) {
        parts.push(address.road || address.pedestrian);
      }
      
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      
      if (address.state) {
        parts.push(address.state);
      }
      
      if (address.country) {
        parts.push(address.country);
      }
      
      return parts.join(', ');
    }
    
    return `Location (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `Location (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})`;
  }
} 