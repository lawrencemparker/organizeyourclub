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
  FileText,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [orgData, setOrgData] = useState<{ name: string; chapter: string } | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  
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

          // Fetch all organizations this user belongs to for the Switcher
          const { data: membersData } = await supabase
            .from('members')
            .select('role, org_id, organizations(id, name, chapter)')
            .eq('email', user.email);
            
          setAvailableOrgs(membersData || []);

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

          const { data: currentMember } = await supabase
            .from('members')
            .select('id, role, permissions')
            .eq('email', user.email)
            .eq('org_id', profileData.organization_id)
            .maybeSingle();
          
          const role = (currentMember?.role || profileData.role || '').toLowerCase();
          
          if (role !== 'admin' && role !== 'president') {
             const permMap: Record<string, boolean> = {};
             
             if (currentMember?.permissions && Object.keys(currentMember.permissions).length > 0) {
               Object.keys(currentMember.permissions).forEach(pageName => {
                 const pagePerms = currentMember.permissions[pageName];
                 permMap[pageName.toLowerCase()] = !!pagePerms.read; 
               });
             } else {
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

  const handleSwitchOrg = async (memberRecord: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({
        organization_id: memberRecord.org_id,
        role: memberRecord.role
      }).eq('id', user.id);
      
      if (error) throw error;
      
      // Force a full window reload to completely clear and rebuild app context
      window.location.href = '/overview';
    } catch (err) {
      toast.error("Failed to switch organization");
    }
  };

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/overview" }, // Updated path
    { label: "Members", icon: Users, path: "/members" },
    { label: "Events", icon: Calendar, path: "/events" },
    { label: "Documents", icon: FileText, path: "/documents" },
    { label: "Compliance", icon: ClipboardCheck, path: "/compliance" },
    { label: "Finances", icon: Wallet, path: "/finance" },
    { label: "History", icon: History, path: "/history" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    const currentRole = profile?.role?.toLowerCase() || "";
    if (currentRole === 'admin' || currentRole === 'president') return true;
    if (item.label === 'Overview') return true;
    return !!pagePermissions[item.label.toLowerCase()];
  });

  return (
    <div className="flex flex-col h-full w-64 bg-[#0B0F1A] border-r border-border/40 shrink-0">
      
      {/* ORGANIZATION SWITCHER */}
      <div className="p-4 border-b border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center w-full gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left group">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl shrink-0 transition-colors duration-300 shadow-md">
                {orgData?.name && orgData.name !== "No Organization" && orgData.name !== "Connection Error" ? orgData.name.substring(0, 2).toUpperCase() : "KA"}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm truncate text-foreground leading-none group-hover:text-white transition-colors">
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
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[230px] bg-[#0B0F1A] border-white/10 text-white shadow-xl rounded-xl ml-2" align="start">
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Organizations</div>
            {availableOrgs.map((orgMember, idx) => {
              const org = Array.isArray(orgMember.organizations) ? orgMember.organizations[0] : orgMember.organizations;
              if (!org) return null;
              
              return (
                <DropdownMenuItem 
                  key={idx} 
                  className="cursor-pointer hover:bg-white/5 focus:bg-white/5 flex items-center gap-3 py-3 px-3 rounded-lg"
                  onClick={() => handleSwitchOrg(orgMember)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                    {org.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-sm leading-none truncate">{org.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 capitalize truncate">{orgMember.role}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* NAVIGATION MENU */}
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

      {/* FOOTER */}
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