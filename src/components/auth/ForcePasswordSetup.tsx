import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ForcePasswordSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForcePasswordSetup({ open, onOpenChange }: ForcePasswordSetupProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update the password in Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // 2. Auto-activate the user in the members table!
      const { error: memberError } = await supabase
        .from('members')
        .update({ status: 'Active' })
        .eq('email', user.email);

      if (memberError) {
         console.error("Failed to update member status to active:", memberError);
      }

      // 3. Complete the setup
      toast.success("Password secured! Welcome to the platform.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing by clicking outside if they haven't set a password
      if (val === false) return; 
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[450px] bg-[#0B0F1A] border-white/10 text-white shadow-2xl [&>button]:hidden">
        <DialogHeader className="text-left mb-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 border border-[var(--primary)]/20">
            <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle className="text-2xl font-black">Secure Your Account</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5">
            You've been invited! Please set a secure password to activate your account and access the dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
              className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              required 
            />
          </div>

          <div className="pt-4 border-t border-white/10 mt-6">
            <Button type="submit" disabled={loading} className="w-full bg-[var(--primary)] text-white hover:opacity-90 h-11 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Securing..." : "Save Password & Enter App"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}