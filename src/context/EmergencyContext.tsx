import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  status: 'active' | 'inactive';
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  clientId: string;
  type: 'panic' | 'accident' | 'assistance' | 'fire_and_security' | 'hijack' | 'home_intrusion';
  status: 'active' | 'acknowledged' | 'resolved';
  message?: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

export interface MaintenanceRequest {
  id: string;
  clientId: string;
  issueDescription: string;
  imageUrl?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface EmergencyContextType {
  clients: Client[];
  alerts: Alert[];
  maintenanceRequests: MaintenanceRequest[];
  currentClient: Client | null;
  loading: boolean;
  createAlert: (type: 'panic' | 'accident' | 'assistance' | 'fire_and_security' | 'hijack' | 'home_intrusion', message?: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  createMaintenanceRequest: (description: string, imageFile: File | null) => Promise<void>;
  updateMaintenanceStatus: (requestId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => Promise<void>;
  updateLocation: (location: { lat: number; lng: number }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadData();
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin()) {
        // Admin loads all clients, alerts, and maintenance requests
        await Promise.all([loadClients(), loadAlerts(), loadMaintenanceRequests()]);
      } else {
        // Client loads their own data
        await Promise.all([loadCurrentClient(), loadClientAlerts(), loadMaintenanceRequests()]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading clients:', error);
      return;
    }

    const formattedClients: Client[] = data.map(client => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      emergencyContact: client.emergency_contact,
      status: client.status,
      location: client.location_lat && client.location_lng ? {
        lat: parseFloat(client.location_lat),
        lng: parseFloat(client.location_lng)
      } : undefined,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));

    setClients(formattedClients);
  };

  const loadCurrentClient = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading current client:', error);
      return;
    }

    if (data) {
      const client: Client = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContact: data.emergency_contact,
        status: data.status,
        location: data.location_lat && data.location_lng ? {
          lat: parseFloat(data.location_lat),
          lng: parseFloat(data.location_lng)
        } : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setCurrentClient(client);
      setClients([client]);
    }
  };

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading alerts:', error);
      return;
    }

    const formattedAlerts: Alert[] = data.map(alert => ({
      id: alert.id,
      clientId: alert.client_id,
      type: alert.type,
      status: alert.status,
      message: alert.message,
      location: {
        lat: parseFloat(alert.location_lat),
        lng: parseFloat(alert.location_lng)
      },
      timestamp: new Date(alert.created_at)
    }));

    setAlerts(formattedAlerts);
  };

  const loadClientAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading client alerts:', error);
      return;
    }

    const formattedAlerts: Alert[] = data.map(alert => ({
      id: alert.id,
      clientId: alert.client_id,
      type: alert.type,
      status: alert.status,
      message: alert.message,
      location: {
        lat: parseFloat(alert.location_lat),
        lng: parseFloat(alert.location_lng)
      },
      timestamp: new Date(alert.created_at)
    }));

    setAlerts(formattedAlerts);
  };

  const setupRealtimeSubscriptions = () => {
    const subscriptions: any[] = [];

    // Subscribe to alerts changes
    const alertsChannel = supabase
      .channel('alerts-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('Alert change received:', payload);
          if (isAdmin()) {
            loadAlerts();
          } else {
            loadClientAlerts();
          }
        }
      )
      .subscribe();

    subscriptions.push(alertsChannel);

    // Subscribe to clients changes (admin only)
    if (isAdmin()) {
      const clientsChannel = supabase
        .channel('clients-channel')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          (payload) => {
            console.log('Client change received:', payload);
            loadClients();
          }
        )
        .subscribe();

      subscriptions.push(clientsChannel);
    }

    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Use default location if geolocation fails
          resolve({ lat: 40.7128, lng: -74.0060 }); // New York City
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const createAlert = async (type: 'panic' | 'accident' | 'assistance' | 'fire_and_security' | 'hijack' | 'home_intrusion', message?: string) => {
    if (!user || !currentClient) {
      throw new Error('User not authenticated');
    }

    try {
      const location = await getCurrentLocation();

      // Update client location first
      await updateLocation(location);

      const { error } = await supabase
        .from('alerts')
        .insert({
          client_id: user.id,
          type,
          message,
          location_lat: location.lat,
          location_lng: location.lng,
          status: 'active'
        });

      if (error) throw error;
      
      // Refresh alerts
      if (isAdmin()) {
        await loadAlerts();
      } else {
        await loadClientAlerts();
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ 
        status: 'acknowledged',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }

    await loadAlerts();
  };

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ 
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }

    await loadAlerts();
  };

  const updateLocation = async (location: { lat: number; lng: number }) => {
    if (!user) return;

    const { error } = await supabase
      .from('clients')
      .update({
        location_lat: location.lat,
        location_lng: location.lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating location:', error);
      throw error;
    }

    // Update local state
    if (currentClient) {
      setCurrentClient({
        ...currentClient,
        location
      });
    }

    // Update clients list if admin
    if (isAdmin()) {
      await loadClients();
    }
  };

  const loadMaintenanceRequests = async () => {
    if (!user) return;

    const query = supabase
      .from('maintenance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin()) {
      query.eq('client_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading maintenance requests:', error);
      return;
    }

    const formattedRequests: MaintenanceRequest[] = data.map(req => ({
      id: req.id,
      clientId: req.client_id,
      issueDescription: req.issue_description,
      imageUrl: req.image_url,
      status: req.status,
      priority: req.priority,
      resolvedAt: req.resolved_at ? new Date(req.resolved_at) : undefined,
      createdAt: new Date(req.created_at),
      updatedAt: new Date(req.updated_at)
    }));

    setMaintenanceRequests(formattedRequests);
  };

  const createMaintenanceRequest = async (description: string, imageFile: File | null) => {
    if (!user || !currentClient) {
      throw new Error('User not authenticated');
    }

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('maintenance-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('maintenance-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          client_id: user.id,
          issue_description: description,
          image_url: imageUrl,
          status: 'pending',
          priority: 'medium'
        });

      if (error) throw error;

      await loadMaintenanceRequests();
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      throw error;
    }
  };

  const updateMaintenanceStatus = async (
    requestId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }

    await loadMaintenanceRequests();
  };

  const refreshData = async () => {
    await loadData();
  };

  const value: EmergencyContextType = {
    clients,
    alerts,
    maintenanceRequests,
    currentClient,
    loading,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    createMaintenanceRequest,
    updateMaintenanceStatus,
    updateLocation,
    refreshData
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}