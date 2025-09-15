import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { AlertTriangle, Car, HelpCircle, Phone } from 'lucide-react';

export default function EmergencyButtons() {
  const { createAlert, currentClient } = useEmergency();
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const emergencyTypes = [
    {
      id: 'panic',
      label: 'PANIC ALERT',
      description: 'Immediate emergency assistance needed',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      textColor: 'text-white'
    },
    {
      id: 'accident',
      label: 'ACCIDENT',
      description: 'Medical or vehicle accident',
      icon: Car,
      color: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
      textColor: 'text-white'
    },
    {
      id: 'assistance',
      label: 'ASSISTANCE',
      description: 'Non-emergency help needed',
      icon: HelpCircle,
      color: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      textColor: 'text-white'
    }
  ];

  const handleEmergencyClick = (type: 'panic' | 'accident' | 'assistance') => {
    setShowConfirm(type);
  };

  const confirmAlert = (type: 'panic' | 'accident' | 'assistance') => {
    createAlert(type);
    setShowConfirm(null);
    
    // Show success notification
    alert(`${type.toUpperCase()} alert sent to security control center!\nYour location has been shared and help is on the way.`);
  };

  if (!currentClient) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Response</h2>
        <p className="text-gray-600">Press any button below to alert security control center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {emergencyTypes.map((emergency) => {
          const Icon = emergency.icon;
          return (
            <button
              key={emergency.id}
              onClick={() => handleEmergencyClick(emergency.id as 'panic' | 'accident' | 'assistance')}
              className={`${emergency.color} ${emergency.textColor} p-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-95`}
            >
              <div className="text-center">
                <Icon className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{emergency.label}</h3>
                <p className="text-sm opacity-90">{emergency.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm {showConfirm.toUpperCase()} Alert
              </h3>
              <p className="text-gray-600 mb-6">
                This will immediately notify the security control center and share your current location.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAlert(showConfirm as 'panic' | 'accident' | 'assistance')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Send Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Phone className="w-4 h-4" />
          <span className="text-sm">24/7 Emergency Hotline: </span>
          <a href="tel:911" className="text-red-600 font-semibold hover:underline">
            911
          </a>
        </div>
      </div>
    </div>
  );
}