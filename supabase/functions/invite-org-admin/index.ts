import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { email, orgFullName, redirectTo } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    if (verifyError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Extract Initials dynamically (e.g. "Alpha Phi Omega" -> "AP")
    const baseName = orgFullName.split('-')[0].trim();
    const nameParts = baseName.split(' ').filter(Boolean);
    const orgInitials = nameParts.length >= 2 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
      : (nameParts[0]?.substring(0, 2).toUpperCase() || "OG");

    const metadata = {
      organization_name: orgFullName,
      org_name: orgFullName,
      org_initials: orgInitials // Passed directly to template
    };

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { user_metadata: metadata });
    }

    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo ?? `${Deno.env.get("SITE_URL")}/`, data: metadata },
    });

    if (otpError) throw otpError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});