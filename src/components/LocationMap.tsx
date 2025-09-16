import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import InteractiveMap from './InteractiveMap';

export default function LocationMap() {
  const { currentClient, updateLocation } = useEmergency();

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location access was denied. To enable location services:\n\n1. Click the location icon in your browser\'s address bar\n2. Select "Allow" for location access\n3. Refresh the page and try again\n\nOr check your browser settings under Privacy & Security > Site Settings > Location.');
          } else {
            alert('Unable to get location. Please check your browser settings.');
          }
        }
      );
    }
  };

  if (!currentClient?.location) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Location Not Available</h3>
          <p className="text-gray-500 mb-4">Enable location services to see your position</p>
          <button
            onClick={refreshLocation}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  // Check if location is default (0,0) - means no real location set
  const hasRealLocation = currentClient.location.lat !== 0 || currentClient.location.lng !== 0;

  if (!hasRealLocation) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Location Not Available</h3>
          <p className="text-gray-500 mb-4">Enable location services to see your position</p>
          <button
            onClick={refreshLocation}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96">
      <InteractiveMap
        locations={[{
          id: 'current',
          lat: currentClient.location.lat,
          lng: currentClient.location.lng,
          name: 'Your Location',
          type: 'current'
        }]}
        center={currentClient.location}
        zoom={15}
        className="h-full"
      />

      {/* Location Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Current Location</p>
            <p className="text-xs text-gray-500">
              Lat: {currentClient.location.lat.toFixed(6)}, Lng: {currentClient.location.lng.toFixed(6)}
            </p>
          </div>
          <button
            onClick={refreshLocation}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Refresh location"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}