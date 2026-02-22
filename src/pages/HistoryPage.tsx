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
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassModal } from "@/components/shared/GlassModal";

// Interface for Email Log
interface EmailLog {
  id: string;
  created_at: string;
  subject: string;
  recipient_name: string;
  recipient_email: string;
  message_body: string;
  status: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data States
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (!profile?.organization_id) return;

        // 1. Fetch System Activity (Mocked based on members for now)
        const { data: members } = await supabase.from('members').select('name, joined_date').eq('org_id', profile.organization_id).order('joined_date', { ascending: false }).limit(10);
        
        const mockActivity = members?.map((m, i) => ({
          id: `log-${i}`,
          action: "Member Added",
          details: `Added ${m.name} to the roster`,
          user: "Admin",
          date: m.joined_date || new Date().toISOString(),
          type: "member"
        })) || [];
        setActivityLogs(mockActivity);

        // 2. Fetch Email History (Real Data)
        const { data: emails } = await supabase
          .from("communications")
          .select("*")
          .eq('org_id', profile.organization_id) // Ensure we filter by Org
          .order("created_at", { ascending: false });
          
        setEmailLogs(emails || []);

      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Format Date Helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredActivity = activityLogs.filter(log => 
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmails = emailLogs.filter(log => 
    log.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="History & Logs" 
        subtitle="Audit trail of system activity and communications." 
      />

      <div className="glass-card min-h-[500px] flex flex-col">
        <Tabs defaultValue="activity" onValueChange={setActiveTab} className="w-full">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="activity">System Activity</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={activeTab === "activity" ? "Search actions..." : "Search emails..."}
                  className="pl-9 bg-black/20 border-white/10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="border-white/10"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* TAB 1: SYSTEM ACTIVITY */}
          <TabsContent value="activity" className="m-0">
            <div className="divide-y divide-white/5">
              {filteredActivity.length > 0 ? filteredActivity.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                  <div className={cn("p-2 rounded-full shrink-0", "bg-blue-500/10 text-blue-500")}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{log.action}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-white/5 text-muted-foreground">
                        {formatDate(log.date)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.user}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No system activity found.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: COMMUNICATIONS (From your Uploaded File) */}
          <TabsContent value="communications" className="m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground font-medium border-b border-white/5 bg-white/5">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEmails.length > 0 ? filteredEmails.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{log.recipient_name}</span>
                          <span className="text-xs text-muted-foreground">{log.recipient_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.subject}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">
                          <CheckCircle className="w-3 h-3 mr-1" /> Sent
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedEmail(log)}
                          className="hover:text-[var(--primary)]"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No emails sent yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Details Modal */}
      <GlassModal
        open={!!selectedEmail}
        onOpenChange={(open) => !open && setSelectedEmail(null)}
        title={selectedEmail?.subject || "Email Details"}
        description={`Sent to ${selectedEmail?.recipient_name}`}
      >
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="p-3 rounded-md bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Sent Date</p>
                <p>{selectedEmail ? formatDate(selectedEmail.created_at) : "-"}</p>
             </div>
             <div className="p-3 rounded-md bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Recipient Email</p>
                <p>{selectedEmail?.recipient_email}</p>
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