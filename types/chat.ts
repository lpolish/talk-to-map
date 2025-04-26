import { Coordinates, MapType } from './map';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface ChatProps {
  currentMapState?: {
    center: Coordinates;
    zoom: number;
    locationName?: string;
    mapType?: MapType;
  };
  onNavigate: (coordinates: Coordinates, zoom?: number) => void;
}

export interface ChatWindowProps extends ChatProps {
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  positionClassName?: string;
}

export interface PlaceLink {
  name: string;
  coordinates: Coordinates;
  zoom?: number;
} 