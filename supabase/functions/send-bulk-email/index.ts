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
    // FIX: Intercepting the sender's details from the frontend
    const { to, subject, message, senderName, senderEmail } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY in Supabase secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    // Fallbacks just in case the name isn't set in their profile
    const safeName = senderName || "A Club Administrator";
    const safeReplyTo = senderEmail || "notifications@organizeyourclub.com";

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // FIX: The email will now read: "Tina Lynn Howard (Organize Your Club)"
        from: `${safeName} (Organize Your Club) <notifications@organizeyourclub.com>`,
        // FIX: If they hit reply, it goes directly to Tina's email!
        reply_to: safeReplyTo, 
        to: to, 
        subject: subject,
        // FIX: Added a clean, automated signature to the bottom of the email
        html: `
          <p style="font-size: 14px; color: #1a1a1a;">${message.replace(/\n/g, '<br/>')}</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin-top: 30px;" />
          <p style="font-size: 12px; color: #666666; margin-top: 15px;">
            This message was sent by <strong>${safeName}</strong> (${safeReplyTo}) via Organize Your Club. <br/>
            You can reply directly to this email to respond to them.
          </p>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
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