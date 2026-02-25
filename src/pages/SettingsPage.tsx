import { useState, useEffect } from "react";
import { User, Shield, Building2, Save, Loader2, Cloud, Link as LinkIcon, Key, Plus, Eye, Edit2, X, Check, Circle, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SecurityForm } from "@/components/settings/SecurityForm";
import useDrivePicker from "react-google-drive-picker";

const GOOGLE_CLIENT_ID = "445602928145-04ou963ouaaodvrqkkriabkokdinkisl.apps.googleusercontent.com";
const GOOGLE_API_KEY = "AIzaSyDRn3b-rtO9Kob9H-p5e1dLK6JqHN4bbcA";

function GoogleDriveIcon({ className }: { className?: string }) { return (<svg viewBox="0 0 87.3 78" className={className} xmlns="http://www.w3.org/2000/svg"><path d="m6.6 66.85 25.3-43.8 25.3 43.8z" fill="#0066da" opacity=".3"/><path d="m6.6 66.85 25.3-43.8 25.3 43.8z" fill="#0066da"/><path d="m43.8 23.05 25.3-43.8-25.3 43.8z" fill="#00ac47"/><path d="m6.6 66.85 43.8-25.3 43.8 25.3z" fill="#ea4335"/><path d="m27.35 8.05-20.75 35.75-6.6-11.35 27.35-47.45h26.5l-6.6 11.4z" fill="#00ac47"/><path d="m27.35 8.05 26.5 45.9h-53.1l26.6-45.9z" fill="#00ac47" opacity=".1"/><path d="m53.85 53.95h53.1l6.6 11.4h-66.3z" fill="#0066da"/><path d="m27.35 8.05 26.5 45.9h-53.1l26.6-45.9z" fill="#0066da" opacity=".1"/><path d="m53.85 53.95-26.5-45.9 26.5 45.9z" fill="#0066da"/><path d="m53.85 53.95 26.5-45.9-20.75-35.75-32.35 56.1z" fill="#ea4335"/><path d="m27.35 8.05 26.5 45.9h-53.1l26.6-45.9z" fill="#ea4335" opacity=".1"/><path d="m27.35 8.05 32.35 56.1-26.5-45.9z" fill="#ea4335"/></svg>); }

const CRUD = ["create", "read", "update", "delete"];
const APP_PAGES = ["Members", "Events", "Documents", "Compliance", "Finances", "History", "Settings"];

const buildDefaultForSingleUser = (user: any, pages: string[]) => {
  const perms: any = {};
  pages.forEach((p) => {
    const role = (user.role || "").toLowerCase();
    const isAdminOrPres = role === "president" || role === "admin";
    perms[p] = { create: isAdminOrPres, read: true, update: isAdminOrPres, delete: isAdminOrPres };
  });
  return perms;
};

const CRUD_ICONS: any = { create: <Plus className="w-4 h-4" />, read: <Eye className="w-4 h-4" />, update: <Edit2 className="w-4 h-4" />, delete: <X className="w-4 h-4" /> };
const CRUD_COLORS: any = {
  create: { on: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", off: "text-muted-foreground bg-white/5 border-transparent hover:bg-white/10" },
  read:   { on: "text-blue-400 bg-blue-400/10 border-blue-400/20", off: "text-muted-foreground bg-white/5 border-transparent hover:bg-white/10" },
  update: { on: "text-amber-400 bg-amber-400/10 border-amber-400/20", off: "text-muted-foreground bg-white/5 border-transparent hover:bg-white/10" },
  delete: { on: "text-rose-400 bg-rose-400/10 border-rose-400/20", off: "text-muted-foreground bg-white/5 border-transparent hover:bg-white/10" },
};

function PermissionsManagerComponent({ orgId }: { orgId: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [pages] = useState<string[]>(APP_PAGES);
  const [permissions, setPermissions] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('members').select('id, full_name, role, permissions').eq('org_id', orgId).order('full_name');
      if (!error && data) {
        const fetchedUsers = data.map(m => ({ id: m.id, name: m.full_name || 'Unnamed Member', role: m.role || 'Member' }));
        const loadedPerms: any = {};
        data.forEach(m => { const defaultPerms = buildDefaultForSingleUser(m, APP_PAGES); loadedPerms[m.id] = { ...defaultPerms, ...(m.permissions || {}) }; });
        setUsers(fetchedUsers); setPermissions(loadedPerms); if (fetchedUsers.length > 0) setSelectedUser(fetchedUsers[0]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [orgId]);

  const updateDatabase = async (userId: string, userPermissions: any) => {
    try {
      const { error } = await supabase.from('members').update({ permissions: userPermissions }).eq('id', userId);
      if (error) throw error; toast.success("Permissions saved", { duration: 1500 });
    } catch (err) { toast.error("Database sync failed."); }
  };

  const togglePerm = (userId: string, page: string, action: string) => {
    setPermissions((prev: any) => {
      const willBeOn = !prev[userId][page][action];
      const newPagePerms = { ...prev[userId][page] };
      if (action === 'create' || action === 'update' || action === 'delete') { newPagePerms.create = willBeOn; newPagePerms.update = willBeOn; newPagePerms.delete = willBeOn; } else { newPagePerms[action] = willBeOn; }
      const updatedUserPerms = { ...prev[userId], [page]: newPagePerms };
      updateDatabase(userId, updatedUserPerms); return { ...prev, [userId]: updatedUserPerms };
    });
  };

  const toggleAllForPage = (userId: string, page: string) => {
    setPermissions((prev: any) => {
      const current = prev[userId][page]; const allOn = CRUD.every((a) => current[a]);
      const updatedUserPerms = { ...prev[userId], [page]: Object.fromEntries(CRUD.map((a) => [a, !allOn])) };
      updateDatabase(userId, updatedUserPerms); return { ...prev, [userId]: updatedUserPerms };
    });
  };

  const canDo = (userId: string, page: string, action: string) => permissions[userId]?.[page]?.[action] ?? false;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div><h3 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5 text-[var(--primary)]" />Permissions Manager</h3><p className="text-sm text-muted-foreground mt-1">Manage role-based access control and page-level security.</p></div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-2 shrink-0 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Select User</h4>
          <div className="space-y-1">
            {users.map((u) => (
              <button key={u.id} onClick={() => setSelectedUser(u)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border", selectedUser?.id === u.id ? "bg-white/10 border-[var(--primary)]/50 text-white" : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5")}>
                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-bold border border-white/10 shrink-0 uppercase">{u.name[0]}</div>
                <div className="text-left flex-1 min-w-0"><p className="font-medium text-sm truncate">{u.name}</p><p className="text-xs opacity-70 font-mono truncate capitalize">{u.role}</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {selectedUser && permissions[selectedUser.id] && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center"><span className="font-bold text-foreground">{selectedUser.name}'s Permissions</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-muted-foreground font-medium border-b border-white/5">
                    <tr><th className="px-6 py-4">Page</th>{CRUD.map((a) => (<th key={a} className="px-4 py-4 text-center uppercase text-xs tracking-wider">{a}</th>))}<th className="px-4 py-4 text-center uppercase text-xs tracking-wider">All</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pages.map((page) => {
                      const perms = permissions[selectedUser.id][page] || {}; const allOn = CRUD.every((a) => perms[a]);
                      return (
                        <tr key={page} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-muted-foreground">{page}</td>
                          {CRUD.map((action) => (<td key={action} className="px-4 py-4 text-center"><button onClick={() => togglePerm(selectedUser.id, page, action)} className={cn("w-9 h-9 rounded-md inline-flex items-center justify-center border transition-all duration-200 transform hover:scale-110", perms[action] ? CRUD_COLORS[action].on : CRUD_COLORS[action].off)}>{CRUD_ICONS[action]}</button></td>))}
                          <td className="px-4 py-4 text-center"><button onClick={() => toggleAllForPage(selectedUser.id, page)} className={cn("w-9 h-9 rounded-md inline-flex items-center justify-center border transition-all duration-200", allOn ? "bg-white text-black border-white" : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10")}>{allOn ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [activeTab, setActiveTab] = useState("profile"); 
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [chapter, setChapter] = useState("");
  const [brandColor, setBrandColor] = useState("#F10914");
  const [openDrivePicker] = useDrivePicker();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "security") { setActiveTab("security"); navigate("/settings", { replace: true }); }
  }, [location.search, navigate]);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

      if (profile?.organization_id) {
        setOrgId(profile.organization_id);
        
        const { data: org } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single();
        if (org) {
          setOrgName(org.name); setChapter(org.chapter || "");
          const color = org.brand_color || "#F10914";
          setBrandColor(color); document.documentElement.style.setProperty('--primary', color);
          
          const { data: currentMember } = await supabase
            .from('members')
            .select('role, permissions')
            .eq('email', user.email)
            .eq('org_id', profile.organization_id)
            .maybeSingle();

          const role = currentMember?.role?.toLowerCase() || '';
          const isSuper = role === 'admin' || role === 'president';
          const perms = currentMember?.permissions?.['Settings'] || {};

          // ─── URL REDIRECT SECURITY ───
          if (!isSuper && perms.read === false) {
            toast.error("Access Denied: You do not have permission to view Settings.");
            navigate('/overview', { replace: true });
            return; 
          }

          setIsAdmin(isSuper);
        }
      }
    }
    loadSettings();
  }, [user]);

  const handleOpenGooglePicker = () => {
    if (!orgId) return;
    openDrivePicker({
      clientId: GOOGLE_CLIENT_ID, developerKey: GOOGLE_API_KEY, viewId: "DOCS", showUploadView: true, showUploadFolders: true, supportDrives: true, multiselect: true,
      callbackFunction: async (data: any, authResponse: any) => {
        if (data.action === "picked") {
          toast.loading("Saving documents...");
          const newDocs = data.docs.map((doc: any) => ({ org_id: orgId, name: doc.name, type: doc.mimeType.includes("pdf") ? "PDF" : "Google Doc", size: "Cloud File", source: 'google', url: doc.url, created_at: new Date().toISOString() }));
          const { error } = await supabase.from('documents').insert(newDocs);
          toast.dismiss();
          if (error) toast.error("Failed to save documents.");
          else { toast.success(`${newDocs.length} document(s) added successfully!`); navigate('/documents'); }
        }
      },
    });
  };

  const handleSaveOrg = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('organizations').update({ name: orgName, chapter: chapter, brand_color: brandColor }).eq('id', orgId);
      if (error) throw error;
      document.documentElement.style.setProperty('--primary', brandColor); toast.success("Organization settings updated");
    } catch (err: any) { toast.error(err.message || "Update failed"); } finally { setLoading(false); }
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    ...(isAdmin ? [{ id: "org", label: "Organization", icon: Building2 }, { id: "integrations", label: "Integrations", icon: LinkIcon }, { id: "permissions", label: "Permissions", icon: Key }] : []),
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader title="Settings" subtitle="Manage your profile, organization, and connections" />
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon; const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200", isActive ? "bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm border border-[var(--primary)]/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")}><Icon className="w-4 h-4" />{tab.label}</button>);
          })}
        </aside>
        <div className="flex-1 glass-card p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "security" && <SecurityForm />}
          {activeTab === "permissions" && <PermissionsManagerComponent orgId={orgId} />}
          {activeTab === "org" && (
            <div className="space-y-8 max-w-2xl">
              <div><h3 className="text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-[var(--primary)]" />Organization Details</h3><p className="text-sm text-muted-foreground mt-1">Manage public branding and chapter information.</p></div>
              <div className="space-y-6">
                <div className="grid gap-2"><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-white/5 border-white/10" /></div>
                <div className="grid gap-2"><Label>Chapter Location</Label><Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Wilmington DE Chapter" className="bg-white/5 border-white/10" /></div>
                <div className="grid gap-2"><Label>Brand Color Palette</Label><div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10"><div className="w-10 h-10 rounded-full shadow-lg border-2 border-white/20 transition-colors duration-300" style={{ backgroundColor: brandColor }} /><Input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="max-w-[120px] font-mono text-xs uppercase bg-black/20"/><Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer bg-transparent border-none"/></div></div>
                <div className="pt-4 flex justify-end border-t border-white/10"><Button onClick={handleSaveOrg} disabled={loading} className="bg-[var(--primary)] hover:opacity-90 text-white px-8">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save Changes</Button></div>
              </div>
            </div>
          )}
          {activeTab === "integrations" && (
            <div className="space-y-8 max-w-3xl">
              <div><h3 className="text-lg font-bold flex items-center gap-2"><Cloud className="w-5 h-5 text-[var(--primary)]" />Document Integrations</h3><p className="text-sm text-muted-foreground mt-1">Connect external storage providers to securely attach documents to your repository.</p></div>
              <div className="grid gap-6">
                <div className="p-5 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[var(--primary)]/30 transition-all">
                  <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0"><GoogleDriveIcon /></div><div><h4 className="font-semibold text-foreground flex items-center gap-2">Google Drive</h4><p className="text-xs text-muted-foreground mt-1">Attach Google Docs, Sheets, and PDFs.</p></div></div>
                  <Button variant="default" size="sm" onClick={handleOpenGooglePicker} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] font-medium">Add from Google Drive</Button>
                </div>
                <div className="p-5 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[var(--primary)]/30 transition-all">
                  <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-lg bg-[#0078D4] flex items-center justify-center shrink-0"><Cloud className="w-7 h-7 text-white" /></div><div><h4 className="font-semibold text-foreground flex items-center gap-2">Microsoft OneDrive</h4><p className="text-xs text-muted-foreground mt-1">Attach Word, Excel, and PowerPoint files.</p></div></div>
                  <Button variant="default" size="sm" onClick={() => toast.info("OneDrive integration coming soon!")} className="bg-[#0078D4] hover:opacity-90 text-white min-w-[160px] font-medium">Add from OneDrive</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}