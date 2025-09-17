import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapPin, AlertTriangle, Users, Circle, RefreshCw } from 'lucide-react';
import InteractiveMap from './InteractiveMap';

export default function AdminMap() {
  const { clients, alerts } = useEmergency();
  
  const activeClients = clients.filter(client => client.status === 'active' && client.location);
  const activeAlerts = alerts.filter(alert => alert.status === 'active');

  // Prepare map locations
  const mapLocations = [
    // Client locations
    ...activeClients.filter(client => client.location && (client.location.lat !== 0 || client.location.lng !== 0)).map(client => ({
      id: client.id,
      lat: client.location!.lat,
      lng: client.location!.lng,
      name: client.name,
      type: 'client' as const
    })),
    // Alert locations
    ...activeAlerts.map(alert => {
      const client = clients.find(c => c.id === alert.clientId);
      return {
        id: alert.id,
        lat: alert.location.lat,
        lng: alert.location.lng,
        name: client?.name || 'Unknown Client',
        type: 'alert' as const,
        status: alert.status,
        alertType: alert.type
      };
    })
  ];

  const handleLocationClick = (location: any) => {
    console.log('Location clicked:', location);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Map View */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Live Client Map</h3>
                <p className="text-sm text-gray-500">Real-time locations and alerts</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh map"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <InteractiveMap
            locations={mapLocations}
            center={{ lat: 40.7128, lng: -74.0060 }}
            zoom={12}
            onLocationClick={handleLocationClick}
            className="h-96"
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Map Legend</h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Active Client</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Client with Alert</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-700">Inactive Client</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Live Statistics</h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Online</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{activeClients.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-700">Alerts</span>
              </div>
              <span className="text-lg font-bold text-red-600">{activeAlerts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Tracked</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {clients.filter(c => c.location).length}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Recent Activity</h4>
          </div>
          <div className="p-4 space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const client = clients.find(c => c.id === alert.clientId);
              return (
                <div key={alert.id} className="flex items-center space-x-3">
                  <Circle className={`w-2 h-2 ${
                    alert.status === 'active' ? 'text-red-500 fill-current' :
                    alert.status === 'acknowledged' ? 'text-yellow-500 fill-current' : 
                    'text-green-500 fill-current'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{client?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{alert.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}