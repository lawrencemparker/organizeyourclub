import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext"; 

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: string[];
}

export function EmailModal({ isOpen, onClose, recipients }: EmailModalProps) {
  const { user } = useAuth(); 
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [senderName, setSenderName] = useState("");

  // Fetch the sender's full name from the members table when the modal opens
  useEffect(() => {
    const fetchSenderName = async () => {
      if (!user?.email || !isOpen) return;
      const { data } = await supabase
        .from('members')
        .select('full_name')
        .eq('email', user.email)
        .single();
        
      if (data?.full_name) {
        setSenderName(data.full_name);
      }
    };
    
    fetchSenderName();
  }, [user, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Please fill out the subject and message.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          recipients: recipients, 
          subject: subject, 
          message: message,
          senderEmail: user?.email,
          senderName: senderName // Pass the fetched name to the server
        }
      });

      if (error) throw error;
      
      toast.success(`Successfully sent to ${recipients.length} member(s)!`);
      
      setSubject("");
      setMessage("");
      onClose();
    } catch (error: any) {
      console.error("Email error:", error);
      toast.error("Failed to send email. Ensure your Supabase Edge Function is deployed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0B0F1A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-[#EF4444]" /> Compose Message
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Sending to {recipients.length} selected member{recipients.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase">Recipients</Label>
            <Input 
              disabled 
              value={recipients.join(", ")} 
              className="bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase">Subject *</Label>
            <Input 
              required 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g. Important Chapter Update" 
              className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase">Message *</Label>
            <Textarea 
              required 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Type your message here..." 
              className="min-h-[150px] bg-white/5 border-white/10 text-white focus:border-[var(--primary)] resize-none" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#EF4444] text-white hover:opacity-90 font-bold px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Email
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}