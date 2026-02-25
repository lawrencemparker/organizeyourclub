import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MoreVertical, Edit2, Trash2, Mail, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MemberForm } from "@/components/members/MemberForm";

export function MembersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMembers = async () => {
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
      const perms = currentMember?.permissions?.['Members'] || {};

      // ─── URL REDIRECT SECURITY ───
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Members.");
        navigate('/overview', { replace: true });
        return; 
      }

      setCanCreate(isSuper || !!perms.create);
      setCanEdit(isSuper || !!perms.update);
      setCanDelete(isSuper || !!perms.delete);

      const { data: roster, error } = await supabase
        .from('members')
        .select('*')
        .eq('org_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(roster || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [user]);

  const filteredMembers = members.filter(m => 
    (m.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member removed successfully");
      fetchMembers();
    } catch (err: any) { toast.error("Failed to remove member"); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedMembers(filteredMembers.map(m => m.id));
    else setSelectedMembers([]);
  };

  const handleSelectMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const handleIndividualEmail = (id: string) => {
    setSelectedMembers([id]);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) return toast.error("Subject and message are required.");
    if (!orgId) return;

    setIsSending(true);
    try {
      const recipients = members.filter(m => selectedMembers.includes(m.id));
      const logs = recipients.map(r => ({
        organization_id: orgId, subject: emailSubject, message_body: emailMessage,
        recipient_email: r.email, recipient_name: r.full_name || 'Member',
        sender_email: user?.email, status: 'Sent'
      }));

      const { data, error } = await supabase.functions.invoke('send-email', { body: { logs } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Email successfully sent to ${recipients.length} member(s)!`);
      setIsEmailModalOpen(false); setSelectedMembers([]); setEmailSubject(""); setEmailMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send emails.");
    } finally { setIsSending(false); }
  };

  const recipientNames = members.filter(m => selectedMembers.includes(m.id)).map(m => m.full_name || m.email).join(', ');

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8 relative">
      <PageHeader 
        title="Members" 
        subtitle="Manage your organization's roster and roles."
        actions={
          <div className="flex items-center gap-3">
            {selectedMembers.length > 0 && (
              <Button onClick={() => setIsEmailModalOpen(true)} className="bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30 flex items-center gap-2 rounded-full font-bold animate-in fade-in zoom-in duration-200">
                <Mail className="w-4 h-4" /> Send Email ({selectedMembers.length})
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => { setEditingMember(null); setIsFormOpen(true); }} className="bg-[var(--primary)] hover:opacity-90 text-white shadow-md shadow-[var(--primary)]/20">
                <Plus className="w-4 h-4 mr-2" /> Add Member
              </Button>
            )}
          </div>
        }
      />

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border/40 flex justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search members..." className="pl-9 bg-white/5 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
              <tr>
                <th className="px-6 py-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0} onChange={handleSelectAll} /></th>
                <th className="px-6 py-4">Member</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredMembers.map((m) => {
                const initials = m.full_name ? m.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                const statusLower = m.status?.toLowerCase();
                const isSelected = selectedMembers.includes(m.id);

                return (
                  <tr key={m.id} className={cn("transition-colors group", isSelected ? "bg-[var(--primary)]/5" : "hover:bg-white/5")}>
                    <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" checked={isSelected} onChange={() => handleSelectMember(m.id)} /></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0 border border-[var(--primary)]/20">{initials}</div><div><p className="font-medium text-foreground">{m.full_name || 'Unnamed Member'}</p><p className="text-xs text-muted-foreground">{m.email}</p></div></div></td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">{m.role || 'Member'}</td>
                    <td className="px-6 py-4"><Badge variant="outline" className={cn(statusLower === "active" ? "border-[var(--primary)]/30 text-[var(--primary)] bg-[var(--primary)]/10" : statusLower === "pending" ? "border-orange-500/30 text-orange-500 bg-orange-500/10" : "border-red-500/30 text-red-500 bg-red-500/10")}>{m.status || 'Unknown'}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleIndividualEmail(m.id)}><Mail className="w-4 h-4 mr-2" /> Send Email</DropdownMenuItem>
                          {canEdit && <DropdownMenuItem className="cursor-pointer" onClick={() => { setEditingMember(m); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit Member</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">No members found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#0B0F1A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><Mail className="w-5 h-5 text-[var(--primary)]" /> Compose Email</DialogTitle>
            <DialogDescription className="text-muted-foreground">Drafting a message to {selectedMembers.length} member(s).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-5 pt-4">
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To</Label><div className="bg-white/5 border border-white/10 rounded-md px-3 py-2.5 text-sm text-white/80 max-h-20 overflow-y-auto custom-scrollbar leading-relaxed">{recipientNames || "No members selected"}</div></div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Meeting Reminder..." className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]" required /></div>
            <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</Label><textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Type your message here..." rows={6} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none" required /></div>
            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(false)} className="border-white/10 text-muted-foreground hover:text-white">Cancel</Button>
              <Button type="submit" disabled={isSending} className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[120px]">{isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Now</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <MemberForm open={isFormOpen} onOpenChange={setIsFormOpen} memberToEdit={editingMember} onSuccess={fetchMembers} />
    </div>
  );
}