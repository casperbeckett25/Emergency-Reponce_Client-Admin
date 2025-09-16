import React, { useState, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Navigation, Layers } from 'lucide-react';

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'client' | 'alert' | 'current';
  status?: 'active' | 'acknowledged' | 'resolved';
  alertType?: 'panic' | 'accident' | 'assistance';
}

interface InteractiveMapProps {
  locations: MapLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onLocationClick?: (location: MapLocation) => void;
  showControls?: boolean;
  className?: string;
}

export default function InteractiveMap({ 
  locations, 
  center = { lat: 40.7128, lng: -74.0060 }, 
  zoom = 12,
  onLocationClick,
  showControls = true,
  className = "h-96"
}: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  const getLocationColor = (location: MapLocation) => {
    if (location.type === 'current') return 'bg-blue-600';
    if (location.type === 'alert') {
      if (location.status === 'resolved') return 'bg-gray-500';
      if (location.status === 'acknowledged') return 'bg-yellow-500';
      switch (location.alertType) {
        case 'panic': return 'bg-red-600';
        case 'accident': return 'bg-orange-600';
        case 'assistance': return 'bg-blue-600';
        default: return 'bg-red-600';
      }
    }
    return 'bg-green-600';
  };

  const getLocationIcon = (location: MapLocation) => {
    if (location.type === 'alert') {
      return '⚠️';
    }
    if (location.type === 'current') {
      return '📍';
    }
    return '👤';
  };

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location);
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  const zoomIn = () => setMapZoom(prev => Math.min(prev + 1, 18));
  const zoomOut = () => setMapZoom(prev => Math.max(prev - 1, 1));
  const resetView = () => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  // Calculate map bounds based on locations
  const mapBounds = locations.length > 0 ? {
    minLat: Math.min(...locations.map(l => l.lat)) - 0.01,
    maxLat: Math.max(...locations.map(l => l.lat)) + 0.01,
    minLng: Math.min(...locations.map(l => l.lng)) - 0.01,
    maxLng: Math.max(...locations.map(l => l.lng)) + 0.01,
  } : null;

  return (
    <div className={`relative ${className} bg-gray-100 rounded-lg overflow-hidden border`}>
      {/* Map Background */}
      <div className={`absolute inset-0 ${
        mapStyle === 'satellite' 
          ? 'bg-gradient-to-br from-green-800 via-green-700 to-blue-800' 
          : 'bg-gradient-to-br from-blue-50 to-green-50'
      }`}>
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Street Pattern */}
        <div className="absolute inset-0">
          {/* Horizontal streets */}
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400 opacity-40"></div>
          <div className="absolute top-2/4 left-0 right-0 h-2 bg-gray-500 opacity-50"></div>
          <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400 opacity-40"></div>
          
          {/* Vertical streets */}
          <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400 opacity-40"></div>
          <div className="absolute left-2/4 top-0 bottom-0 w-2 bg-gray-500 opacity-50"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400 opacity-40"></div>
        </div>

        {/* Location Markers */}
        {locations.map((location, index) => {
          // Calculate position based on map bounds or use default positioning
          const positionStyle = mapBounds ? {
            left: `${((location.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100}%`,
            top: `${100 - ((location.lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100}%`,
          } : {
            left: `${20 + (index % 5) * 15}%`,
            top: `${20 + Math.floor(index / 5) * 20}%`,
          };

          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={positionStyle}
              onClick={() => handleLocationClick(location)}
            >
              <div className="relative group">
                <div className={`w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getLocationColor(location)} ${
                  location.type === 'alert' && location.status === 'active' ? 'animate-pulse' : ''
                }`}>
                  <span className="text-white text-xs">
                    {getLocationIcon(location)}
                  </span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs opacity-75">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                    {location.type === 'alert' && (
                      <p className="text-xs text-red-300 capitalize">
                        {location.alertType} - {location.status}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                </div>
                
                {/* Pulsing circle for active alerts */}
                {location.type === 'alert' && location.status === 'active' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-200 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={resetView}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Toggle Map Style"
          >
            <Layers className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Zoom: {mapZoom}</span>
          <span>•</span>
          <span>{locations.length} locations</span>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{selectedLocation.name}</h4>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
          {selectedLocation.type === 'alert' && (
            <div className="space-y-1">
              <p className="text-sm font-medium capitalize text-red-600">
                {selectedLocation.alertType} Alert
              </p>
              <p className="text-xs text-gray-500 capitalize">
                Status: {selectedLocation.status}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}