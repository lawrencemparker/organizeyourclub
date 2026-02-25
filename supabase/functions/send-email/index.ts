import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Unauthorized: Missing auth token");

    const { logs } = await req.json();
    if (!logs || logs.length === 0) throw new Error("No recipients provided");

    // 2. Initialize Admin Client to bypass RLS for logging
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Verify the user requesting the email send is real
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    if (verifyError || !user) throw new Error("Unauthorized: Invalid session");

    // Extract sender details from their secure auth token
    const senderEmail = user.email;
    const senderName = user.user_metadata?.full_name || user.user_metadata?.name || "Organization Admin";

    // 4. Log the communications to your database so it shows up on HistoryPage
    const { error: dbError } = await supabaseAdmin.from('communications').insert(logs);
    if (dbError) throw new Error(`Database logging failed: ${dbError.message}`);

    // 5. Connect to Resend to actually deliver the custom emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY secret is missing in Supabase backend. Emails logged to history but NOT delivered.");
    }

    // Map the logs into Resend's batch format using your verified domain
    const emailsToSend = logs.map((log: any) => ({
      from: "Organize Your Club <onboarding@organizeyourclub.com>",
      to: log.recipient_email,
      reply_to: log.sender_email || senderEmail, // <-- CRITICAL: Forces replies to go directly back to the sender!
      subject: log.subject,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; max-width: 600px;">
               <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">${log.message_body}</p>
               
               <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #4b5563;">
                 Reply-To set to: ${senderName} (<a href="mailto:${log.sender_email || senderEmail}" style="color: #2563eb; text-decoration: underline;">${log.sender_email || senderEmail}</a>)
               </div>
             </div>`
    }));

    // Dispatch the batch via Resend API
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailsToSend)
    });

    if (!res.ok) {
      const resError = await res.text();
      throw new Error(`Resend API Error: ${resError}`);
    }

    // Success response
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("send-email error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});