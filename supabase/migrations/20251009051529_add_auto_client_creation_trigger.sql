/*
  # Add Auto Client Creation Trigger

  1. Changes
    - Creates a trigger function to automatically create a client record when a new user signs up
    - Creates a trigger that fires after user insertion in auth.users
    - Inserts missing client records for existing auth users

  2. Details
    - The trigger creates a client record with default values
    - Client ID matches the auth user ID for proper relationship
*/

-- Function to create client record for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, name, phone, email, address, emergency_contact, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Client'),
    COALESCE(NEW.raw_user_meta_data->>'phone', 'Not provided'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'address', 'Not provided'),
    COALESCE(NEW.raw_user_meta_data->>'emergency_contact', 'Not provided'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create client records for existing auth users that don't have client records
INSERT INTO public.clients (id, name, phone, email, address, emergency_contact, status)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'Client User'),
  COALESCE(u.raw_user_meta_data->>'phone', 'Not provided'),
  u.email,
  COALESCE(u.raw_user_meta_data->>'address', 'Not provided'),
  COALESCE(u.raw_user_meta_data->>'emergency_contact', 'Not provided'),
  'active'
FROM auth.users u
LEFT JOIN public.clients c ON u.id = c.id
WHERE c.id IS NULL AND u.email NOT LIKE '%@admin.%'
ON CONFLICT (id) DO NOTHING;
