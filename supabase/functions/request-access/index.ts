import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── 1. Look up member + org info ───────────────────────────────────────
    const { data: memberData } = await supabaseAdmin
      .from("members")
      .select(`org_id, organizations (name, chapter, is_suspended)`)
      .ilike("email", email)
      .maybeSingle();

    // BUG FIX: Old code silently returned success here without sending anything.
    // Now we still send the invite even if no member row exists yet, so the
    // frontend insert-then-invoke race condition can't cause a silent drop.
    const org = memberData
      ? (Array.isArray(memberData.organizations)
          ? memberData.organizations[0]
          : memberData.organizations)
      : null;

    if (org?.is_suspended) {
      return new Response(JSON.stringify({ error: "Organization is suspended" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const orgFullName = org?.chapter
      ? `${org.name} - ${org.chapter}`
      : org?.name || "Your Organization";

    const nameParts = (org?.name || "Your Organization").split(" ").filter(Boolean);
    const orgInitials =
      nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : nameParts[0]?.substring(0, 2).toUpperCase() || "OG";

    const destination = redirectTo ?? `${Deno.env.get("SITE_URL")}/login`;

    // ─── 2. Check if this email already has an auth account ─────────────────
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // ── Existing auth user: update metadata then send a password-reset link ──
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          organization_name: orgFullName,
          org_name: orgFullName,
          org_initials: orgInitials,
        },
      });

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        email,
        { redirectTo: destination }
      );
      if (resetError) throw resetError;

    } else {
      // ── Brand-new user: inviteUserByEmail creates the auth account AND sends
      //    the invitation email in one step. resetPasswordForEmail silently
      //    does nothing for accounts that don't exist yet (Supabase email
      //    enumeration protection), which is why first-time invites were lost. ──
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: destination,
          data: {
            organization_name: orgFullName,
            org_name: orgFullName,
            org_initials: orgInitials,
          },
        }
      );
      if (inviteError) throw inviteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});