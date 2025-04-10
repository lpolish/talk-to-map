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
    <div className={`fixed top-14 left-0 right-0 z-30 flex justify-center items-center pointer-events-none ${className}`}>
      <div className="flex bg-white/85 backdrop-blur shadow-lg rounded-md pointer-events-auto overflow-hidden border border-gray-200">
        {(Object.keys(mapTypeLabels) as MapType[]).map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`px-4 py-2 text-sm transition-all duration-200 border-r last:border-r-0 border-gray-200 ${
              selectedType === type
                ? 'bg-blue-600 text-white font-medium shadow-inner'
                : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
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