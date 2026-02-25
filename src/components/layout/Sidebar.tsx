import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  History, 
  Settings, 
  LogOut,
  ShieldCheck,
  ClipboardCheck,
  Wallet,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [orgData, setOrgData] = useState<{ name: string; chapter: string } | null>(null);
  
  // State to hold READ permissions and loading status
  const [pagePermissions, setPagePermissions] = useState<Record<string, boolean>>({});
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    async function getProfileData() {
      if (!user) return;
      setMenuLoading(true);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role, organization_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile({
            full_name: profileData.full_name,
            role: profileData.role
          });

          // Fetch Organization Data
          if (profileData.organization_id) {
            const { data: oData, error: orgError } = await supabase
              .from('organizations')
              .select('name, chapter, brand_color')
              .eq('id', profileData.organization_id)
              .single();
            
            if (oData && !orgError) {
              setOrgData(oData);
              if (oData.brand_color) {
                document.documentElement.style.setProperty('--primary', oData.brand_color);
              }
            } else {
              setOrgData({ name: "Unnamed Org", chapter: "Setup Required" });
            }
          } else {
             setOrgData({ name: "No Organization", chapter: "Please link your profile" });
          }

          // Fetch the 'permissions' JSON column directly from the 'members' table
          const { data: currentMember } = await supabase
            .from('members')
            .select('id, role, permissions')
            .eq('email', user.email)
            .maybeSingle();
          
          const role = (currentMember?.role || profileData.role || '').toLowerCase();
          
          // Only non-admins need to have their read permissions evaluated
          if (role !== 'admin' && role !== 'president') {
             const permMap: Record<string, boolean> = {};
             
             // The permissions are stored as a JSON object, so we loop through it to build our map
             if (currentMember?.permissions && Object.keys(currentMember.permissions).length > 0) {
               Object.keys(currentMember.permissions).forEach(pageName => {
                 const pagePerms = currentMember.permissions[pageName];
                 permMap[pageName.toLowerCase()] = !!pagePerms.read; 
               });
             } else {
               // NEW DEFAULT: If they have no permissions explicitly saved yet, they default to READ for all pages
               menuItems.forEach(item => {
                 permMap[item.label.toLowerCase()] = true;
               });
             }
             
             setPagePermissions(permMap);
          }
        }
      } catch (error) {
        console.error("Error loading sidebar data:", error);
        setOrgData({ name: "Connection Error", chapter: "Check database" });
      } finally {
        setMenuLoading(false);
      }
    }
    getProfileData();
  }, [user]);

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/" },
    { label: "Members", icon: Users, path: "/members" },
    { label: "Events", icon: Calendar, path: "/events" },
    { label: "Documents", icon: FileText, path: "/documents" },
    { label: "Compliance", icon: ClipboardCheck, path: "/compliance" },
    { label: "Finances", icon: Wallet, path: "/finance" },
    { label: "History", icon: History, path: "/history" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  // Filter the menu items based on the user's READ permissions
  const visibleMenuItems = menuItems.filter(item => {
    const currentRole = profile?.role?.toLowerCase() || "";
    
    // Admins and Presidents bypass permission checks and see everything
    if (currentRole === 'admin' || currentRole === 'president') return true;
    
    // EVERYONE gets access to the Overview landing page automatically
    if (item.label === 'Overview') return true;
    
    // Convert label to lowercase to safely match against our normalized permissions map
    return !!pagePermissions[item.label.toLowerCase()];
  });

  return (
    <div className="flex flex-col h-full w-64 bg-[#0B0F1A] border-r border-border/40 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl shrink-0 transition-colors duration-300">
            {orgData?.name && orgData.name !== "No Organization" && orgData.name !== "Connection Error" ? orgData.name.substring(0, 2).toUpperCase() : "KA"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate text-foreground leading-none">
              {orgData?.name || "Loading..."}
            </h2>
            {orgData?.chapter && (
              <p className="text-[11px] text-muted-foreground truncate font-medium mt-1 leading-tight">
                {orgData.chapter}
              </p>
            )}
            
            {(profile?.role?.toLowerCase() === 'admin' || profile?.role?.toLowerCase() === 'president') && (
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--primary)] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin View</span>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="px-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Menu</p>
        
        {menuLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse w-full"></div>
            ))}
          </div>
        ) : visibleMenuItems.length > 0 ? (
          visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-[var(--primary)]" : "group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })
        ) : (
          <div className="px-3 py-4 text-center border border-white/5 bg-white/5 rounded-lg mt-2">
            <p className="text-xs text-muted-foreground font-medium">No page access granted.</p>
          </div>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-border/40 space-y-2">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0 transition-colors duration-300">
              {profile.full_name?.split(' ').map(n => n[0]).join('') || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}