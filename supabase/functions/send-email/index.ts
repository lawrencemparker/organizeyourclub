import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract the newly added senderName from the frontend payload
    const { recipients, subject, message, senderEmail, senderName } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // 2. Format the display name safely
    const displayName = senderName ? `${senderName} (${senderEmail})` : senderEmail;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Organize Your Club <notifications@organizeyourclub.com>',
        reply_to: senderEmail, 
        to: recipients,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <p style="white-space: pre-wrap;">${message}</p>
            <br />
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px; margin: 0;">
              This message was sent by <strong>${displayName}</strong> via Organize Your Club.
            </p>
          </div>
        `
      })
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
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