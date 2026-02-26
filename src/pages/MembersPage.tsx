import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MoreVertical, Edit2, Trash2, Mail, Plus, Send, Users } from "lucide-react";
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

  // Single Invite State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Bulk Invite State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [isBulkInviting, setIsBulkInviting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, failed: 0 });

  // Email State
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
    if (!confirm("Are you sure you want to remove this member from the organization?")) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member removed successfully");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to remove member");
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

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEmails.trim()) return;

    setIsBulkInviting(true);
    setBulkProgress({ current: 0, total: 0, failed: 0 });

    try {
      const extractedEmails = bulkEmails
        .split(/[\n,]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

      if (extractedEmails.length === 0) {
        toast.error("No valid email addresses found.");
        setIsBulkInviting(false);
        return;
      }

      setBulkProgress({ current: 0, total: extractedEmails.length, failed: 0 });

      let successCount = 0;
      let skippedCount  = 0;
      let failedCount   = 0;

      for (let i = 0; i < extractedEmails.length; i++) {
        const email = extractedEmails[i];
        setBulkProgress({ current: i + 1, total: extractedEmails.length, failed: failedCount });

        const { data: existing } = await supabase
          .from('members')
          .select('id, status')
          .eq('org_id', orgId)
          .eq('email', email)
          .maybeSingle();

        if (existing && existing.status?.toLowerCase() === 'active') {
          skippedCount++;
          continue;
        }

        if (!existing) {
          const { error: insertError } = await supabase
            .from('members')
            .insert([{
              org_id: orgId,
              email: email,
              full_name: email.split('@')[0],
              role: 'member',
              status: 'Pending'
            }]);

          if (insertError) {
            console.error(`Failed to insert ${email}:`, insertError);
            failedCount++;
            setBulkProgress(prev => ({ ...prev, failed: failedCount }));
            continue;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        const { error: invokeError } = await supabase.functions.invoke("request-access", {
          body: {
            email: email,
            redirectTo: `${window.location.origin}/overview`
          }
        });

        if (invokeError) {
          console.error(`Invite failed for ${email}:`, invokeError);
          failedCount++;
          setBulkProgress(prev => ({ ...prev, failed: failedCount }));
          toast.error(`Failed to send invite to ${email}`);
        } else {
          successCount++;
        }
      }

      const summaryParts = [`Sent ${successCount} invite${successCount !== 1 ? 's' : ''}.`];
      if (skippedCount > 0) summaryParts.push(`${skippedCount} already active.`);
      if (failedCount > 0) summaryParts.push(`${failedCount} failed — check console.`);

      failedCount > 0
        ? toast.warning(summaryParts.join(' '))
        : toast.success(summaryParts.join(' '));

      setIsBulkModalOpen(false);
      setBulkEmails("");
      setBulkProgress({ current: 0, total: 0, failed: 0 });
      fetchMembers();

    } catch (error: any) {
      console.error("Bulk invite error:", error);
      toast.error(error.message || "Failed to process bulk invites.");
    } finally {
      setIsBulkInviting(false);
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
                <span className="hidden sm:inline">Email ({selectedMembers.length})</span>
                <span className="sm:hidden">({selectedMembers.length})</span>
              </Button>
            )}
            {canCreate && (
              <>
                <Button 
                  onClick={() => setIsBulkModalOpen(true)} 
                  variant="outline" 
                  className="border-white/10 text-white hover:bg-white/10 bg-white/5"
                >
                  <Users className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bulk Invite</span>
                </Button>
                <Button onClick={handleAddMember} className="bg-[var(--primary)] text-white hover:opacity-90">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Member</span>
                </Button>
              </>
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

        <div className="rounded-xl border border-white/10 bg-white/5 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-white/10 bg-white/5 accent-[var(--primary)]"
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
                        className="rounded border-white/10 bg-white/5 accent-[var(--primary)]"
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
                      <Badge variant="secondary" className="bg-white/5 text-white border-white/10 capitalize">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(
                        "capitalize border",
                        member.status?.toLowerCase() === 'active' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        member.status?.toLowerCase() === 'pending' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                        member.status?.toLowerCase() === 'inactive' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
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
                              <Trash2 className="w-4 h-4 mr-2" /> Remove
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

      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="bg-[#1A1F2E] border-white/10 text-white w-[95vw] sm:w-full sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Invite Members</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Paste a list of email addresses separated by commas or new lines.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkInvite} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Addresses</Label>
              <textarea 
                value={bulkEmails} 
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder={`john@example.com\njane@university.edu\nmike@company.com`}
                rows={6}
                disabled={isBulkInviting}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none custom-scrollbar disabled:opacity-50"
                required
              />
            </div>

            {isBulkInviting && bulkProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                      backgroundColor: bulkProgress.failed > 0 ? '#f59e0b' : 'var(--primary)'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{bulkProgress.current} of {bulkProgress.total} processed</span>
                  {bulkProgress.failed > 0 && (
                    <span className="text-amber-400">{bulkProgress.failed} failed</span>
                  )}
                </div>
              </div>
            )}
            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsBulkModalOpen(false)}
                className="border-white/10 text-muted-foreground hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isBulkInviting}
                className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[140px]"
              >
                {isBulkInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {bulkProgress.total > 0
                      ? `Sending ${bulkProgress.current} / ${bulkProgress.total}`
                      : "Preparing..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invites
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="bg-[#1A1F2E] border-white/10 text-white w-[95vw] sm:w-full sm:max-w-[600px] rounded-2xl">
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
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] resize-none custom-scrollbar"
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