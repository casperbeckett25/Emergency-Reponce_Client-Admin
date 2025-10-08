/*
  # Complete Emergency Response System Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key) - References auth.users
      - `name` (text) - Client full name
      - `phone` (text) - Contact number
      - `email` (text, unique) - Email address
      - `address` (text) - Physical address
      - `emergency_contact` (text) - Emergency contact details
      - `status` (text) - active/inactive
      - `location_lat` (numeric) - Latitude
      - `location_lng` (numeric) - Longitude
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `alerts`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `type` (text) - Alert type: panic, fire, hijack, home_intrusion, accident, assistance, fire_and_security
      - `status` (text) - active/acknowledged/resolved
      - `message` (text) - Optional message
      - `location_lat` (numeric) - Alert location latitude
      - `location_lng` (numeric) - Alert location longitude
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `maintenance_requests`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `issue_description` (text) - Description of the issue
      - `image_url` (text) - URL to uploaded image
      - `status` (text) - pending/in_progress/completed/cancelled
      - `priority` (text) - low/medium/high/urgent
      - `resolved_at` (timestamp) - When issue was resolved
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Clients can only access their own data
    - Admins can access all data
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  address text NOT NULL,
  emergency_contact text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('panic', 'fire', 'hijack', 'home_intrusion', 'accident', 'assistance', 'fire_and_security')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  message text,
  location_lat numeric NOT NULL,
  location_lng numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  issue_description text NOT NULL,
  image_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

CREATE POLICY "Admins can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

CREATE POLICY "Admins can update all clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for alerts table
CREATE POLICY "Clients can read own alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

CREATE POLICY "Clients can create own alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can update alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

-- Policies for maintenance_requests table
CREATE POLICY "Clients can read own maintenance requests"
  ON maintenance_requests
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

CREATE POLICY "Clients can create own maintenance requests"
  ON maintenance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can update maintenance requests"
  ON maintenance_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_client_id ON maintenance_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance_requests(created_at DESC);

-- Insert sample data
INSERT INTO clients (id, name, phone, email, address, emergency_contact, location_lat, location_lng) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', '+1 (555) 123-4567', 'john.smith@client.com', '123 Main St, Downtown', 'Jane Smith - +1 (555) 987-6543', 40.7128, -74.0060),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '+1 (555) 234-5678', 'sarah.johnson@client.com', '456 Oak Ave, Uptown', 'Mike Johnson - +1 (555) 876-5432', 40.7589, -73.9851),
  ('550e8400-e29b-41d4-a716-446655440003', 'Michael Brown', '+1 (555) 345-6789', 'michael.brown@client.com', '789 Pine St, Midtown', 'Lisa Brown - +1 (555) 765-4321', 40.7505, -73.9934)
ON CONFLICT (email) DO NOTHING;
