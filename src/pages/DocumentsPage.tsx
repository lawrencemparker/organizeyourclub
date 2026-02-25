import { useState, useEffect } from "react";
import { Search, FileText, FolderOpen, Plus, Cloud, HardDrive, Loader2, ExternalLink, Trash2, MoreVertical, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import useDrivePicker from "react-google-drive-picker";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.501 1.15 15l3.43 6h12.49l-6.86-11.9H7.71Z" fill="#00AC47"/><path d="M14.28 3.5 22.85 18.5h-6.86l-5.14-9H14.28Z" fill="#EA4335"/><path d="M1.15 15 5.71 23h13.72l-4.57-8H1.15Z" fill="#2684FC"/>
  </svg>
);

export function DocumentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [openDrivePicker] = useDrivePicker();

  useEffect(() => { fetchDocumentsAndPermissions(); }, [user]);

  async function fetchDocumentsAndPermissions() {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;
      setOrgId(profile.organization_id);

      const { data: currentMember } = await supabase
        .from('members')
        .select('role, permissions')
        .eq('email', user.email)
        .eq('org_id', profile.organization_id)
        .maybeSingle();

      const role = currentMember?.role?.toLowerCase() || '';
      const isSuper = role === 'admin' || role === 'president';
      const perms = currentMember?.permissions?.['Documents'] || {};

      // ─── URL REDIRECT SECURITY ───
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Documents.");
        navigate('/overview', { replace: true });
        return; 
      }

      setCanCreate(isSuper || !!perms.create);
      setCanDelete(isSuper || !!perms.delete);

      const { data: dbDocs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('org_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(dbDocs || []);
    } catch (err) { console.error("Error loading docs:", err); } finally { setLoading(false); }
  }

  const handleOpenGooglePicker = () => {
    if (!orgId) return;
    openDrivePicker({
      clientId: "445602928145-04ou963ouaaodvrqkkriabkokdinkisl.apps.googleusercontent.com",
      developerKey: "AIzaSyDRn3b-rtO9Kob9H-p5e1dLK6JqHN4bbcA",
      viewId: "DOCS", showUploadView: true, showUploadFolders: true, supportDrives: true, multiselect: true,
      callbackFunction: async (data: any, authResponse: any) => {
        if (data.action === "picked") {
          toast.loading("Saving documents...");
          const newDocs = data.docs.map((doc: any) => ({
            org_id: orgId, name: doc.name, type: doc.mimeType.includes("pdf") ? "PDF" : "Google Doc", size: "Cloud File", source: 'google', url: doc.url, created_at: new Date().toISOString()
          }));
          const { error } = await supabase.from('documents').insert(newDocs);
          toast.dismiss();
          if (error) toast.error("Failed to save documents.");
          else { toast.success(`${newDocs.length} document(s) added successfully!`); fetchDocumentsAndPermissions(); }
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this file?")) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      toast.success("File removed"); fetchDocumentsAndPermissions();
    } catch (err) { toast.error("Failed to remove file"); }
  };

  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="Documents" subtitle="Centralized repository for all organization files."
        actions={canCreate && <Button onClick={handleOpenGooglePicker} className="bg-white text-black hover:bg-gray-100 shadow-md border border-gray-200"><GoogleIcon /> <span className="ml-2">Add from Drive</span></Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><HardDrive className="w-6 h-6" /></div><div><p className="text-xs text-muted-foreground uppercase font-bold">Total Files</p><p className="text-xl font-bold">{documents.length}</p></div></div>
        <div className="glass-card p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><ShieldCheck className="w-6 h-6" /></div><div><p className="text-xs text-muted-foreground uppercase font-bold">Security Status</p><p className="text-sm font-bold text-emerald-500">Isolated & Protected</p></div></div>
      </div>
      <div className="glass-card min-h-[500px] flex flex-col">
        <Tabs defaultValue="all" className="w-full">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <TabsList className="bg-white/5"><TabsTrigger value="all">All Files</TabsTrigger><TabsTrigger value="collections">Collections</TabsTrigger></TabsList>
            <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name..." className="pl-9 bg-black/20 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          </div>
          <TabsContent value="all" className="m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground font-medium border-b border-white/5 bg-white/5">
                  <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Source</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Date Added</th><th className="px-6 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="p-2 rounded bg-white/5 text-[var(--primary)]"><FileText className="w-4 h-4" /></div><span className="font-medium text-foreground">{doc.name}</span></div></td>
                      <td className="px-6 py-4">{doc.source === 'google' && <div className="flex items-center gap-2 text-xs text-muted-foreground"><GoogleIcon /> Drive</div>}</td>
                      <td className="px-6 py-4"><Badge variant="secondary" className="bg-white/10 hover:bg-white/20">{doc.type}</Badge></td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canDelete && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end"><DropdownMenuItem className="text-red-500" onClick={() => handleDelete(doc.id)}><Trash2 className="w-4 h-4 mr-2" /> Remove from App</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button variant="default" className="bg-white/10 hover:bg-[var(--primary)] text-white" onClick={() => window.open(doc.url, '_blank')}><ExternalLink className="w-4 h-4 mr-2" /> Open</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No documents found.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}