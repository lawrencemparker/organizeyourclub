import { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, Mail, Send, Plus, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Member } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberForm } from "@/components/members/MemberForm";
import { EmailModal } from "@/components/members/EmailModal";

export function MembersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null); 
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('org_id', profile.organization_id)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const mappedMembers = (data || []).map(m => ({
        ...m,
        name: m.full_name, 
        avatar: m.full_name ? m.full_name.substring(0, 2).toUpperCase() : '??'
      }));

      setMembers(mappedMembers);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members list");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filteredMembers = members.filter(member => 
    (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FIXED: Force ID to be a string to prevent type-mismatch bugs
  const toggleSelection = (id: string | number) => {
    const stringId = String(id);
    setSelectedIds(prev => 
      prev.includes(stringId) ? prev.filter(x => x !== stringId) : [...prev, stringId]
    );
  };

  // FIXED: Force all mapped IDs to be strings
  const toggleAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => String(m.id)));
    }
  };

  // FIXED: Robust matching logic to guarantee emails are extracted
  const handleBulkEmail = () => {
    const recipients = members
      .filter(m => selectedIds.includes(String(m.id)))
      .map(m => m.email)
      .filter(email => email && email.trim() !== "") as string[];
    
    if (recipients.length === 0) {
      toast.error("No valid email addresses found for the selected members.");
      return;
    }
    
    setEmailRecipients(recipients);
    setIsEmailModalOpen(true);
  };

  const handleSingleEmail = (email: string) => {
    if (!email) return;
    setEmailRecipients([email]);
    setIsEmailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this member? This will revoke their access.")) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      toast.success("Member removed");
      
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== String(id)));
      fetchMembers();
    } catch (err) {
      toast.error("Failed to delete member");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="Members" 
        subtitle="Manage your organization's roster and roles." 
        actions={
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button onClick={handleBulkEmail} variant="outline" className="animate-in fade-in zoom-in border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10">
                <Mail className="w-4 h-4 mr-2" /> Email Selected ({selectedIds.length})
              </Button>
            )}
            <Button 
              onClick={() => {
                setEditingMember(null);
                setIsFormOpen(true);
              }} 
              className="bg-[var(--primary)] text-white hover:opacity-90 shadow-md shadow-[var(--primary)]/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Invite Member
            </Button>
          </div>
        }
      />

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
              <tr>
                <th className="px-6 py-4 w-12">
                  <Checkbox 
                    checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                    onCheckedChange={toggleAll}
                    className="w-5 h-5 rounded-full border-2 border-white/30 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)] transition-all"
                  />
                </th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    {/* FIXED: Ensure the checked state evaluates the string version of the ID */}
                    <Checkbox 
                      checked={selectedIds.includes(String(member.id))}
                      onCheckedChange={() => toggleSelection(member.id)}
                      className="w-5 h-5 rounded-full border-2 border-white/30 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)] transition-all"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0 transition-colors duration-300 border border-[var(--primary)]/20">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">{member.role}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      member.status === "Active" 
                        ? "border-[var(--primary)]/30 text-[var(--primary)] bg-[var(--primary)]/10" 
                        : "border-orange-500/30 text-orange-500 bg-orange-500/10"
                    )}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              const { error } = await supabase.auth.signInWithOtp({
                                email: member.email,
                                options: {
                                  shouldCreateUser: false, 
                                  emailRedirectTo: `${window.location.origin}/login`, 
                                }
                              });
                              if (error) throw error;
                              toast.success(`Invite resent to ${member.email}`);
                            } catch (err) {
                              toast.error("Failed to resend invite.");
                            }
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" /> Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSingleEmail(member.email)}>
                          <Mail className="w-4 h-4 mr-2" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingMember(member);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No members found. Click "Invite Member" to add someone.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MemberForm 
        open={isFormOpen} 
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingMember(null);
        }} 
        onSuccess={fetchMembers}
        member={editingMember} 
      />

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        recipients={emailRecipients} 
      />
    </div>
  );
}