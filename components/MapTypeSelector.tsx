import React from 'react';
import { MapType } from '../types/map';

interface MapTypeSelectorProps {
  selectedType: MapType;
  onTypeChange: (type: MapType) => void;
  className?: string;
}

const mapTypeLabels: Record<MapType, string> = {
  standard: 'Standard',
  satellite: 'Satellite',
  relief: 'Relief',
  dark: 'Dark'
};

export const MapTypeSelector: React.FC<MapTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  return (
    <div className={`fixed top-4 z-50 left-1/2 transform -translate-x-1/2 ${className}`}>
      <div className="flex bg-gray-800 shadow-md">
        {(Object.keys(mapTypeLabels) as MapType[]).map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`px-4 py-2 text-sm ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'text-white hover:bg-gray-700'
            }`}
            aria-label={`Switch to ${mapTypeLabels[type]} map view`}
            aria-pressed={selectedType === type}
          >
            {mapTypeLabels[type]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapTypeSelector; 