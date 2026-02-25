import { useState, useEffect } from "react";
import { 
  History, Search, Filter, Calendar, FileText, User, 
  ArrowRight, Loader2, Mail, Eye, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GlassModal } from "@/components/shared/GlassModal";

interface EmailLog {
  id: string; 
  created_at: string; 
  subject: string; 
  sender_email: string;
  recipient_name: string; 
  recipient_email: string; 
  message_body: string; 
  status: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  // Stores a map of email -> Full Name to dynamically resolve sender names without backend changes
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (!profile?.organization_id) return;

        // Fetch user permissions for lock
        const { data: currentMember } = await supabase
          .from('members')
          .select('id, role, permissions')
          .eq('email', user.email)
          .eq('org_id', profile.organization_id)
          .maybeSingle();

        const role = currentMember?.role?.toLowerCase() || '';
        const isSuper = role === 'admin' || role === 'president';
        const perms = currentMember?.permissions?.['History'] || {};

        // ─── URL REDIRECT SECURITY ───
        if (!isSuper && perms.read === false) {
          toast.error("Access Denied: You do not have permission to view History.");
          navigate('/overview', { replace: true });
          return; 
        }

        // Fetch Email History
        const { data: emails } = await supabase
          .from("communications")
          .select("*")
          .eq('organization_id', profile.organization_id) 
          .order("created_at", { ascending: false });
          
        setEmailLogs(emails || []);

        // Fetch Organization Members to map emails to real names
        const { data: roster } = await supabase
          .from("members")
          .select("email, full_name")
          .eq('org_id', profile.organization_id);

        if (roster) {
          const map: Record<string, string> = {};
          roster.forEach(m => {
            if (m.email) {
              map[m.email.toLowerCase()] = m.full_name || m.email;
            }
          });
          setMemberMap(map);
        }

      } catch (error) { 
        console.error("Error loading history:", error); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchData();
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredEmails = emailLogs.filter(log => log.subject.toLowerCase().includes(searchTerm.toLowerCase()) || (log.recipient_email && log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())));

  // Helper function to pull the real name from our member map, falling back to a clean format if not found
  const getSenderName = (email: string | null) => {
    if (!email) return "Unknown Sender";
    return memberMap[email.toLowerCase()] || email.split('@')[0];
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader title="History & Logs" subtitle="Audit trail of system activity and communications." />
      <div className="glass-card min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5">
          <h3 className="font-semibold text-lg px-2">Communications</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto"><div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search emails..." className="pl-9 bg-black/20 border-white/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><Button variant="outline" size="icon" className="border-white/10"><Filter className="w-4 h-4" /></Button></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground font-medium border-b border-white/5 bg-white/5">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Sender</th>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEmails.length > 0 ? filteredEmails.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap"><div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{formatDate(log.created_at)}</div></td>
                  
                  {/* FORMATTED SENDER COLUMN */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground capitalize">{getSenderName(log.sender_email)}</span>
                      <span className="text-xs text-muted-foreground">{log.sender_email || "-"}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4"><div className="flex flex-col"><span className="font-medium text-foreground">{log.recipient_name || "Unknown"}</span><span className="text-xs text-muted-foreground">{log.recipient_email || "-"}</span></div></td>
                  <td className="px-6 py-4 font-medium">{log.subject}</td>
                  <td className="px-6 py-4"><Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge></td>
                  <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedEmail(log)} className="hover:text-[var(--primary)]"><Eye className="w-4 h-4 mr-2" /> View</Button></td>
                </tr>
              )) : <tr><td colSpan={6} className="p-12 text-center text-muted-foreground"><Mail className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No emails sent yet.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      
      <GlassModal 
        open={!!selectedEmail} 
        onOpenChange={(open) => !open && setSelectedEmail(null)} 
        title={selectedEmail?.subject || "Email Details"} 
        description={`Sent on ${selectedEmail ? formatDate(selectedEmail.created_at) : "-"}`}
      >
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
             {/* FORMATTED FROM SECTION */}
             <div className="p-3 rounded-md bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground capitalize">{getSenderName(selectedEmail?.sender_email || null)}</span>
                  <span className="text-xs text-muted-foreground">{selectedEmail?.sender_email || "-"}</span>
                </div>
             </div>
             
             {/* FORMATTED TO SECTION */}
             <div className="p-3 rounded-md bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{selectedEmail?.recipient_name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{selectedEmail?.recipient_email || "-"}</span>
                </div>
             </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Message Body</p>
            <div className="p-4 rounded-md min-h-[150px] whitespace-pre-wrap bg-white/5 border border-white/10 text-sm leading-relaxed">
              {selectedEmail?.message_body}
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSelectedEmail(null)}>Close</Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}