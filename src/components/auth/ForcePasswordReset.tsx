import { useState, useEffect, useRef } from "react";
import { supabase, isRecoveryFlow, clearRecoveryFlow } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export function ForcePasswordReset() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const checkFlowRef = useRef<() => Promise<void>>();

  useEffect(() => {
    const checkFlow = async () => {
      if (!user?.email) return;

      const { data } = await supabase.from("members").select("status").ilike("email", user.email);
      const hasActiveRow = data?.some(m => m.status?.toLowerCase() === "active");

      setIsOpen(!!(hasActiveRow && isRecoveryFlow));
    };

    checkFlowRef.current = checkFlow;
    checkFlow();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") checkFlowRef.current?.();
    });

    return () => authListener.subscription.unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const { data: memberRecord } = await supabase
        .from("members")
        .select(`org_id, role, organizations (name, chapter)`)
        .ilike("email", user?.email || "")
        .limit(1)
        .maybeSingle();

      let orgFullName = "Your Organization";
      let orgInitials = "OG";

      if (memberRecord?.organizations) {
        const orgData = Array.isArray(memberRecord.organizations) ? memberRecord.organizations[0] : memberRecord.organizations;
        orgFullName = orgData?.chapter ? `${orgData.name} - ${orgData.chapter}` : orgData?.name || "Your Organization";
        
        const baseName = (orgData?.name || "Your Organization").trim();
        const nameParts = baseName.split(' ').filter(Boolean);
        orgInitials = nameParts.length >= 2 
          ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
          : (nameParts[0]?.substring(0, 2).toUpperCase() || "OG");
      }

      const { error: authError } = await supabase.auth.updateUser({ 
        password,
        data: {
          organization_name: orgFullName, 
          org_name: orgFullName,
          org_initials: orgInitials
        }
      });
      if (authError && !authError.message.toLowerCase().includes("different from the old")) throw authError;

      if (memberRecord?.org_id && user?.id) {
        await supabase.from("profiles").update({ organization_id: memberRecord.org_id, role: memberRecord.role }).eq("id", user.id);
      }

      toast.success("Password updated successfully!");
      clearRecoveryFlow();
      setIsOpen(false);
      setPassword("");
      window.history.replaceState(null, "", window.location.pathname);

    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] bg-[#0B0F1A] border-white/10 text-white [&>button]:hidden">
        <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4 w-full">
          <div className="mx-auto w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle className="text-xl font-bold text-center w-full block">Update Your Password</DialogTitle>
          <DialogDescription className="text-center w-full block text-muted-foreground text-sm">
            For security, please enter a new password to continue to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</Label>
            <Input disabled value={user?.email || ""} className="bg-black/40 border-white/5 text-muted-foreground cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-[var(--primary)]">New Password *</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] tracking-widest" required />
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Minimum 8 characters. Must include lowercase, uppercase, digits, and symbols.</p>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4">
            <Button type="submit" disabled={loading} className="w-full bg-[var(--primary)] text-white hover:opacity-90 shadow-lg">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Secure Account & Enter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}