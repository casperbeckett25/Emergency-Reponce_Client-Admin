import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          address: string;
          emergency_contact: string;
          status: 'active' | 'inactive';
          location_lat: number | null;
          location_lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email: string;
          address: string;
          emergency_contact: string;
          status?: 'active' | 'inactive';
          location_lat?: number | null;
          location_lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          address?: string;
          emergency_contact?: string;
          status?: 'active' | 'inactive';
          location_lat?: number | null;
          location_lng?: number | null;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          client_id: string;
          type: 'panic' | 'accident' | 'assistance' | 'fire' | 'hijack' | 'home_intrusion';
          status: 'active' | 'acknowledged' | 'resolved';
          message: string | null;
          location_lat: number;
          location_lng: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type: 'panic' | 'accident' | 'assistance' | 'fire' | 'hijack' | 'home_intrusion';
          status?: 'active' | 'acknowledged' | 'resolved';
          message?: string | null;
          location_lat: number;
          location_lng: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?: 'panic' | 'accident' | 'assistance';
          status?: 'active' | 'acknowledged' | 'resolved';
          message?: string | null;
          location_lat?: number;
          location_lng?: number;
          updated_at?: string;
        };
      };
    };
  };
};