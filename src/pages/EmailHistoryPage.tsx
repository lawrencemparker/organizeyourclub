import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/shared/PageHeader";
import { GlassModal } from "@/components/shared/GlassModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, User, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Define the shape of our log data
interface EmailLog {
  id: string;
  created_at: string;
  subject: string;
  recipient_name: string;
  recipient_email: string;
  message_body: string;
  status: string;
}

export function EmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // We don't need to filter by Org ID manually because RLS handles it!
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .order("created_at", { ascending: false }); // Newest first

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <PageHeader
        title="Email History"
        subtitle="View a log of all communications sent by your organization"
      />

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading history...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No emails sent yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20 text-left bg-white/5">
                  <th className="py-3 px-6 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="py-3 px-6 text-xs font-medium text-muted-foreground">Recipient</th>
                  <th className="py-3 px-6 text-xs font-medium text-muted-foreground">Subject</th>
                  <th className="py-3 px-6 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-6 text-xs font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/10 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{log.recipient_name}</span>
                        <span className="text-xs text-muted-foreground">{log.recipient_email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-foreground font-medium">
                      {log.subject}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">
                        <CheckCircle className="w-3 h-3 mr-1" /> Sent
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-primary/20 hover:text-primary"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <GlassModal
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        title={selectedLog?.subject || "Email Details"}
        description={`Sent to ${selectedLog?.recipient_name}`}
      >
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="glass-input p-3 rounded-md bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-1">Sent Date</p>
                <p>{selectedLog ? formatDate(selectedLog.created_at) : "-"}</p>
             </div>
             <div className="glass-input p-3 rounded-md bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-1">Recipient Email</p>
                <p>{selectedLog?.recipient_email}</p>
             </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Message Body</p>
            <div className="glass-input p-4 rounded-md min-h-[150px] whitespace-pre-wrap bg-secondary/10 border-border/40 text-sm">
              {selectedLog?.message_body}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}