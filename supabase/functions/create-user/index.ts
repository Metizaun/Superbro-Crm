import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, displayName, role, organizationId } = await req.json()

    // Basic validation
    if (!email || !password || !displayName || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(u => u.email === email)
    
    let authData
    
    if (userExists) {
      // User already exists, use existing user data
      authData = { user: userExists }
      console.log('User already exists, adding to organization:', email)
    } else {
      // Create new user in auth with metadata to prevent auto-creating personal org
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          skip_personal_org: true, // Flag to prevent personal org creation
          invited_organization_id: organizationId // Track intended org
        }
      })

      if (authError) throw authError
      if (!newAuthData.user) throw new Error('User creation failed')
      
      authData = newAuthData
    }

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        display_name: displayName
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      throw profileError
    }

    // Add user to organization
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        organization_id: organizationId,
        role
      })

    if (roleError && roleError.code !== '23505') throw roleError

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})