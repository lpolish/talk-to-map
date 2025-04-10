declare module '../utils/messageParser' {
  import { ReactElement } from 'react';
  import { PlaceLink } from './chat';
  import { Coordinates } from './map';
  
  export function extractPlaceLinks(message: string): PlaceLink[];
  export function formatPlaceLink(name: string, coordinates: Coordinates, zoom?: number): string;
  export function renderMessageWithLinks(
    message: string, 
    onNavigate: (coordinates: Coordinates, zoom?: number) => void
  ): ReactElement;
} 