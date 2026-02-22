import { supabase } from "@/lib/supabase";

export interface UserProfileData {
  fullName: string;
  role: string;
  orgName: string;
  email: string;
}

export async function getUserProfile(): Promise<UserProfileData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Fetch Profile and Join Organization
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        full_name,
        role,
        organization_id,
        organizations (
          name
        )
      `)
      .eq('id', user.id)
      .maybeSingle();

    // --- DEBUG LOGGING START ---
    console.log("DEBUG PROFILE FETCH:", {
      user_id: user.id,
      data: data,
      error: error
    });
    // --- DEBUG LOGGING END ---

    if (error) {
      console.error('Supabase fetch error:', error);
      return null;
    }

    if (!data) {
      console.warn("Profile not found for user:", user.id);
      return {
        fullName: "New User",
        role: "Member",
        orgName: "Profile Missing",
        email: user.email || ""
      };
    }

    // 2. Extract Org Name Properly
    // @ts-ignore
    const fetchedOrgName = data.organizations?.name;

    return {
      fullName: data.full_name || "Admin",
      role: data.role || "Admin",
      orgName: fetchedOrgName || "Org Link Broken", 
      email: user.email || ""
    };

  } catch (error) {
    console.error("System error fetching profile:", error);
    return null;
  }
}