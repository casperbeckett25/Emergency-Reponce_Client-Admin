import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateClientRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    if (!user.email?.includes('@admin.')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const requestData: CreateClientRequest = await req.json();

    // Create auth user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: 'client123',
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        phone: requestData.phone,
        address: requestData.address,
        emergency_contact: requestData.emergency_contact
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Wait for trigger to create client record
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update client record with full details
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        name: requestData.name,
        phone: requestData.phone,
        address: requestData.address,
        emergency_contact: requestData.emergency_contact,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating client record:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: authData.user,
        message: 'Client created successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});