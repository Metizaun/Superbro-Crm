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
    const { userRoleId } = await req.json()

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

    // First get the user_id from the user_role
    const { data: userRole, error: fetchError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('id', userRoleId)
      .single()

    if (fetchError) throw fetchError
    if (!userRole) throw new Error('User role not found')

    // Delete the user role from the organization
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('id', userRoleId)

    if (roleError) throw roleError

    // Delete the user from authentication
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userRole.user_id
    )

    if (authError) {
      console.error('Failed to delete user from auth:', authError)
      // Don't throw here as the role was already deleted
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error deleting user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})