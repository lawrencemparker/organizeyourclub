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

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const handleAddMember = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to delete member");
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    setIsSending(true);
    try {
      const recipients = members
        .filter(m => selectedMembers.includes(m.id))
        .map(m => m.email);

      const { error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          to: recipients,
          subject: emailSubject,
          message: emailMessage,
          orgId: orgId
        }
      });

      if (error) throw error;

      toast.success(`Email sent to ${recipients.length} members`);
      setIsEmailModalOpen(false);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <PageHeader 
        title="Members" 
        description="Manage organization members and roles."
        actions={
          <div className="flex gap-3">
            {selectedMembers.length > 0 && (
              <Button 
                onClick={() => setIsEmailModalOpen(true)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email ({selectedMembers.length})
              </Button>
            )}
            {canCreate && (
              <Button onClick={handleAddMember} className="bg-[var(--primary)] text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search members by name, email, or role..." 
            className="pl-10 bg-white/5 border-white/10 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-white/10 bg-white/5"
                    checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(filteredMembers.map(m => m.id));
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                  />
                </th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-white/10 bg-white/5"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-white/5 text-white border-white/10">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "capitalize",
                        member.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[#1A1F2E] border-white/10 text-white">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleEdit(member)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem onClick={() => handleDelete(member.id)} className="cursor-pointer text-rose-400 hover:bg-rose-400/10 focus:bg-rose-400/10">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="bg-[#1A1F2E] border-white/10 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sending to {selectedMembers.length} selected recipients.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject</Label>
              <Input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Meeting Reminder..."
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</Label>
              <textarea 
                value={emailMessage} 
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none"
                required
              />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEmailModalOpen(false)}
                className="border-white/10 text-muted-foreground hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSending}
                className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[120px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MemberForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={fetchMembers}
        member={editingMember}
      />
    </div>
  );
}