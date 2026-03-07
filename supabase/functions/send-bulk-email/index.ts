import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, message } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      // FIX: Return 200 status with an error body so Supabase doesn't hide the message!
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY in Supabase secrets. Please run the secrets set command." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Organize Your Club <notifications@organizeyourclub.com>',
        to: to, 
        subject: subject,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // FIX: Force the exact Resend error text to the frontend UI
      return new Response(
        JSON.stringify({ error: `Resend API Error: ${data.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Edge Function Catch: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  }
})