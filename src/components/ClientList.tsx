import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { User, Phone, MapPin, Circle, Plus, MoreVertical, Trash2 } from 'lucide-react';
import AddClientModal from './AddClientModal';
import { supabase } from '../lib/supabase';

export default function ClientList() {
  const { clients, alerts, refreshData } = useEmergency();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState<string | null>(null);

  const getClientAlerts = (clientId: string) => {
    return alerts.filter(alert => alert.clientId === clientId && alert.status === 'active');
  };

  const deleteClient = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await supabase.from('clients').delete().eq('id', clientId);
      refreshData();
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Client Management</h3>
            <p className="text-sm text-gray-500">Monitor all registered clients and their status</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Alerts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const clientAlerts = getClientAlerts(client.id);
              return (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.location && (client.location.lat !== 0 || client.location.lng !== 0) ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-green-500" />
                        <span>{client.location.lat.toFixed(4)}, {client.location.lng.toFixed(4)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No location</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Circle
                        className={`w-3 h-3 mr-2 ${
                          client.status === 'active' ? 'text-green-400 fill-current' : 'text-gray-400 fill-current'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium capitalize ${
                          client.status === 'active' ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {clientAlerts.length > 0 ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-sm font-bold">{clientAlerts.length}</span>
                        </div>
                        <span className="ml-2 text-sm text-red-600 font-medium">
                          {clientAlerts.length === 1 ? 'Active Alert' : 'Active Alerts'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === client.id ? null : client.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showDropdown === client.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <button
                          onClick={() => {
                            deleteClient(client.id);
                            setShowDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Client
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Client Statistics */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            <p className="text-sm text-gray-500">Total Clients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {clients.filter(c => c.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">Active Clients</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {clients.filter(c => c.location).length}
            </p>
            <p className="text-sm text-gray-500">With Location</p>
          </div>
        </div>
      </div>

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={refreshData}
      />
    </div>
  );
}