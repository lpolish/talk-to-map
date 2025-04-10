export interface Coordinates {
  lat: number;
  lng: number;
}

export type MapType = 'standard' | 'satellite' | 'relief' | 'dark';

export interface MapState {
  center: Coordinates;
  zoom: number;
  locationName?: string;
  mapType?: MapType;
}

export interface MapProps {
  initialCenter?: Coordinates;
  initialZoom?: number;
  initialMapType?: MapType;
  onMapStateChange?: (state: MapState) => void;
}

export type MapNavigationFunction = (coordinates: Coordinates, zoom?: number) => void; 