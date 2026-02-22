import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  from_name?: string
  subject: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Send Email Function Called ===')
    
    // Parse request body
    let emailData: EmailRequest
    try {
      emailData = await req.json()
      console.log('Email request received for:', emailData.to)
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { to, from_name = 'Organization Admin', subject, message } = emailData

    // Validate required fields
    if (!to || !subject || !message) {
      console.error('Missing required fields:', { to: !!to, subject: !!subject, message: !!message })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and message are required' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'Email service is not configured. Please contact support.' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Sending email via Resend API...')
    
    // Send email using Resend API
    const emailPayload = {
      from: `${from_name} <onboarding@resend.dev>`, // You'll need to update this with your verified domain
      to: [to],
      subject: subject,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>`,
      text: message
    }

    console.log('Email payload prepared:', { to: emailPayload.to, subject: emailPayload.subject })

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailPayload)
    })

    const resendData = await resendResponse.json()
    
    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      console.error('Status:', resendResponse.status)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: resendData.message || resendData.error || 'Unknown error from email provider'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✓ Email sent successfully. ID:', resendData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: resendData.id
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('=== Send Email Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('======================')

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred while sending email',
        details: error.toString()
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})