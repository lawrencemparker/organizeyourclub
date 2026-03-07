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
    const { to, subject, message, orgId } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in the Edge Function environment.")
    }

    // Call Resend to fire the email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Organize Your Club <onboarding@organizeyourclub.com>',
        to: ['onboarding@organizeyourclub.com'], // Send to self
        bcc: to, // Blind Carbon Copy (BCC) the array of members for privacy!
        subject: subject,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email via Resend")
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})