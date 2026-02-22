import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()
    
    // 1. Find the User ID using our SQL helper
    const { data: userId, error: findError } = await supabaseAdmin
      .rpc('get_user_id_by_email', { email_input: email })
    
    if (findError || !userId) throw new Error("User not found in Auth system")

    // 2. Generate and Set New Password
    const tempPassword = Math.random().toString(36).slice(-10)
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId, 
      { password: tempPassword }
    )

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, newPassword: tempPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})