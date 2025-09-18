import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Navigation, Layers, Satellite, Map as MapIcon } from 'lucide-react';

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
  const [mapTiles, setMapTiles] = useState<string[][]>([[], [], []]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  // OpenStreetMap tile server URLs
  const tileServers = {
    street: 'https://a.tile.openstreetmap.org',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile'
  };

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    loadMapTiles();
  }, [mapCenter, mapZoom, mapStyle]);

  const loadMapTiles = async () => {
    setLoading(true);
    try {
      // Calculate 3x3 tile grid for better quality
      const tiles: string[][] = [[], [], []];
      
      // Calculate center tile coordinates
      const centerTileX = Math.floor((mapCenter.lng + 180) / 360 * Math.pow(2, mapZoom));
      const tileY = Math.floor((1 - Math.log(Math.tan(mapCenter.lat * Math.PI / 180) + 1 / Math.cos(mapCenter.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, mapZoom));
      
      // Load 3x3 grid of tiles
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const tileX = centerTileX - 1 + col;
          const currentTileY = tileY - 1 + row;
          
          let tileUrl;
          if (mapStyle === 'satellite') {
            tileUrl = `${tileServers.satellite}/${mapZoom}/${currentTileY}/${tileX}`;
          } else {
            tileUrl = `${tileServers.street}/${mapZoom}/${tileX}/${currentTileY}.png`;
          }
          
          tiles[row].push(tileUrl);
        }
      }
      
      setMapTiles(tiles);
    } catch (error) {
      console.error('Error loading map tiles:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const zoomIn = () => {
    if (mapZoom < 18) {
      setMapZoom(prev => prev + 1);
    }
  };

  const zoomOut = () => {
    if (mapZoom > 1) {
      setMapZoom(prev => prev - 1);
    }
  };

  const resetView = () => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const panMap = (direction: 'north' | 'south' | 'east' | 'west') => {
    const panAmount = 0.01 / Math.pow(2, mapZoom - 10);
    setMapCenter(prev => {
      switch (direction) {
        case 'north': return { ...prev, lat: prev.lat + panAmount };
        case 'south': return { ...prev, lat: prev.lat - panAmount };
        case 'east': return { ...prev, lng: prev.lng + panAmount };
        case 'west': return { ...prev, lng: prev.lng - panAmount };
        default: return prev;
      }
    });
  };

  // Calculate marker positions based on map bounds
  const getMarkerPosition = (location: MapLocation) => {
    // Calculate position using proper web mercator projection
    const latDiff = location.lat - mapCenter.lat;
    const lngDiff = location.lng - mapCenter.lng;
    
    // Convert to pixels using web mercator projection
    const pixelsPerDegree = 256 * Math.pow(2, mapZoom) / 360;
    const pixelsPerDegreeLat = 256 * Math.pow(2, mapZoom) / 360 * Math.cos(mapCenter.lat * Math.PI / 180);
    
    // Calculate pixel offset from center
    const xOffset = lngDiff * pixelsPerDegree;
    const yOffset = -latDiff * pixelsPerDegreeLat;
    
    // Convert to percentage of map container (3x3 tiles = 768px total)
    const x = 50 + (xOffset / 768) * 100;
    const y = 50 + (yOffset / 768) * 100;
    
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  return (
    <div className={`relative ${className} bg-gray-100 rounded-lg overflow-hidden border`}>
      {/* Map Tiles */}
      <div ref={mapRef} className="absolute inset-0">
        {loading ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            {/* Render 3x3 tile grid */}
            {mapTiles.map((row, rowIndex) => (
              <div key={rowIndex} className="flex h-1/3">
                {row.map((tileUrl, colIndex) => (
                  <img
                    key={`${rowIndex}-${colIndex}`}
                    src={tileUrl}
                    alt={`Map tile ${rowIndex}-${colIndex}`}
                    className="w-1/3 h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            ))}
            <div className="absolute inset-0 bg-gray-300 -z-10"></div>
          </div>
        )}

        {/* Center crosshair for debugging */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10">
          <div className="w-full h-0.5 bg-red-500 absolute top-1/2 transform -translate-y-1/2"></div>
          <div className="h-full w-0.5 bg-red-500 absolute left-1/2 transform -translate-x-1/2"></div>
        </div>

        {/* Location Markers */}
        {!loading && locations.map((location) => {
          const position = getMarkerPosition(location);
          
          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
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
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-30">
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
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
          <button
            onClick={zoomIn}
            disabled={mapZoom >= 18}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={zoomOut}
            disabled={mapZoom <= 1}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {mapStyle === 'street' ? (
              <Satellite className="w-5 h-5 text-gray-600" />
            ) : (
              <MapIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 grid grid-cols-3 gap-1 z-30">
          <div></div>
          <button
            onClick={() => panMap('north')}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Pan North"
          >
            <span className="text-gray-600 text-xs">↑</span>
          </button>
          <div></div>
          <button
            onClick={() => panMap('west')}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Pan West"
          >
            <span className="text-gray-600 text-xs">←</span>
          </button>
          <div className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center">
            <Navigation className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => panMap('east')}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Pan East"
          >
            <span className="text-gray-600 text-xs">→</span>
          </button>
          <div></div>
          <button
            onClick={() => panMap('south')}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Pan South"
          >
            <span className="text-gray-600 text-xs">↓</span>
          </button>
          <div></div>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-30">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Zoom: {mapZoom}</span>
          <span>•</span>
          <span>{locations.length} locations</span>
          <span>•</span>
          <span className="capitalize">{mapStyle}</span>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40">
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

      {/* Attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded z-30">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}