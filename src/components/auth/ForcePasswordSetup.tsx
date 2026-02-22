import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

export function ForcePasswordSetup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.email) return;
      
      // Look up the user's status in the members table
      const { data, error } = await supabase
        .from('members')
        .select('status')
        .eq('email', user.email)
        .single();

      // If they are flagged as Pending, trigger the mandatory password lock
      if (data?.status === 'Pending') {
        setIsOpen(true);
      }
    };
    
    checkUserStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Securely save the new password to Supabase Authentication
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Update their database status from Pending to Active
      const { error: dbError } = await supabase
        .from('members')
        .update({ status: 'Active' })
        .eq('email', user?.email);
        
      if (dbError) throw dbError;

      toast.success("Password set successfully! Welcome to the organization.");
      setIsOpen(false); // Unlock the screen
      
    } catch (error: any) {
      toast.error(error.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // onOpenChange={undefined} explicitly prevents them from clicking outside to close it
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] glass-card border-white/10 [&>button]:hidden">
        <DialogHeader className="text-center space-y-4 pt-4">
          <div className="mx-auto w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle className="text-2xl font-bold">Account Activation</DialogTitle>
          <DialogDescription className="text-center">
            Welcome! To complete your registration and secure your account, please set a permanent password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
              New Password
            </Label>
            <Input 
              type="password"
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-center text-lg tracking-widest" 
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[var(--primary)] text-white hover:opacity-90 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Activate Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}