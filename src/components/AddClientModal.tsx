import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Phone, Mail, Home, Contact, AlertCircle, Search } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export default function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create auth user with default password
      const defaultPassword = 'client123';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: defaultPassword,
      });

      if (authError) throw authError;

      // Create client record with the auth user ID
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          id: authData.user?.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          emergency_contact: formData.emergencyContact,
        });

      if (clientError) throw clientError;

      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
      });
      onClientAdded();
      onClose();
      
      alert(`Client added successfully!\nLogin credentials:\nEmail: ${formData.email}\nPassword: ${defaultPassword}`);
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Handle address autocomplete
    if (name === 'address' && value.length > 2) {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout for search
      const timeout = setTimeout(() => {
        searchAddresses(value);
      }, 300);
      
      setSearchTimeout(timeout);
    } else if (name === 'address' && value.length <= 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const searchAddresses = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.error('Error searching addresses:', err);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const selectAddress = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.display_name
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Home className="w-4 h-4 inline mr-2" />
              Address
            </label>
            <div className="relative">
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main St, City, State"
                autoComplete="off"
              />
              
              {/* Address suggestions dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectAddress(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.display_name.split(',').slice(0, 2).join(',')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Contact className="w-4 h-4 inline mr-2" />
              Emergency Contact
            </label>
            <input
              type="text"
              name="emergencyContact"
              required
              value={formData.emergencyContact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Name - Phone Number"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">i</span>
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-900">Account Setup</h5>
                <p className="text-sm text-blue-700 mt-1">
                  A new client account will be created with the default password "client123". 
                  The client can change this password after their first login.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}