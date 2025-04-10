import React, { ReactElement } from 'react';
import { PlaceLink } from '../types/chat';
import { Coordinates } from '../types/map';

/**
 * Parses AI messages to extract place links
 * Detects links in the format: [Place Name](geo:lat,lng?zoom=level)
 * Also handles nav format: [Place Name](nav:lat,lng,zoom)
 */
export function extractPlaceLinks(message: string): PlaceLink[] {
  const placeLinks: PlaceLink[] = [];
  
  // Regular expression to find links in the format: [Place Name](geo:lat,lng?zoom=level)
  const geoLinkRegex = /\[([^\]]+)\]\(geo:(-?\d+\.\d+),(-?\d+\.\d+)(?:\?zoom=(\d+))?\)/g;
  
  let match;
  while ((match = geoLinkRegex.exec(message)) !== null) {
    const name = match[1];
    const lat = parseFloat(match[2]);
    const lng = parseFloat(match[3]);
    const zoom = match[4] ? parseInt(match[4]) : undefined;
    
    placeLinks.push({
      name,
      coordinates: { lat, lng },
      zoom
    });
  }
  
  // Also check for nav format links: [Place Name](nav:lat,lng,zoom)
  const navLinkRegex = /\[([^\]]+)\]\(nav:(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)\)/g;
  
  while ((match = navLinkRegex.exec(message)) !== null) {
    const name = match[1];
    const lat = parseFloat(match[2]);
    const lng = parseFloat(match[3]);
    const zoom = parseInt(match[4]);
    
    placeLinks.push({
      name,
      coordinates: { lat, lng },
      zoom
    });
  }
  
  return placeLinks;
}

/**
 * Formats a place link that can be included in messages
 */
export function formatPlaceLink(name: string, coordinates: Coordinates, zoom?: number): string {
  return `[${name}](geo:${coordinates.lat},${coordinates.lng}${zoom ? `?zoom=${zoom}` : ''})`;
}

/**
 * Renders message content with clickable place links
 */
export function renderMessageWithLinks(
  message: string, 
  onNavigate: (coordinates: Coordinates, zoom?: number) => void
): ReactElement {
  const placeLinks = extractPlaceLinks(message);
  
  if (placeLinks.length === 0) {
    return <>{message}</>;
  }
  
  // Build segments including text and links
  const segments: Array<{
    type: 'text' | 'link';
    content: string;
    link?: PlaceLink;
  }> = [];
  
  // First, collect all the links and their positions
  const linkPositions: Array<{
    start: number;
    end: number;
    link: PlaceLink;
    originalText: string;
  }> = [];
  
  // Check for geo links
  const geoLinkRegex = /\[([^\]]+)\]\(geo:(-?\d+\.\d+),(-?\d+\.\d+)(?:\?zoom=(\d+))?\)/g;
  let geoMatch: RegExpExecArray | null;
  while ((geoMatch = geoLinkRegex.exec(message)) !== null) {
    linkPositions.push({
      start: geoMatch.index,
      end: geoMatch.index + geoMatch[0].length,
      link: {
        name: geoMatch[1],
        coordinates: { lat: parseFloat(geoMatch[2]), lng: parseFloat(geoMatch[3]) },
        zoom: geoMatch[4] ? parseInt(geoMatch[4]) : undefined
      },
      originalText: geoMatch[0]
    });
  }
  
  // Check for nav links
  const navLinkRegex = /\[([^\]]+)\]\(nav:(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+)\)/g;
  let navMatch: RegExpExecArray | null;
  while ((navMatch = navLinkRegex.exec(message)) !== null) {
    linkPositions.push({
      start: navMatch.index,
      end: navMatch.index + navMatch[0].length,
      link: {
        name: navMatch[1],
        coordinates: { lat: parseFloat(navMatch[2]), lng: parseFloat(navMatch[3]) },
        zoom: parseInt(navMatch[4])
      },
      originalText: navMatch[0]
    });
  }
  
  // Sort link positions by start index
  linkPositions.sort((a, b) => a.start - b.start);
  
  // Build segments with text and links
  let lastIndex = 0;
  for (const position of linkPositions) {
    if (position.start > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, position.start)
      });
    }
    
    segments.push({
      type: 'link',
      content: position.link.name,
      link: position.link
    });
    
    lastIndex = position.end;
  }
  
  // Add remaining text
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex)
    });
  }
  
  // Render the segments
  const elements = segments.map((segment, i) => {
    if (segment.type === 'text') {
      return <span key={`text-${i}`}>{segment.content}</span>;
    } else {
      // This is a link
      return (
        <a
          key={`link-${i}`}
          href="#"
          className="text-blue-500 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent double-clicks
            if (segment.link) {
              // Add a small delay to prevent UI issues
              setTimeout(() => {
                onNavigate(segment.link!.coordinates, segment.link!.zoom);
              }, 100);
            }
          }}
        >
          {segment.content}
        </a>
      );
    }
  });
  
  return <>{elements}</>;
} 