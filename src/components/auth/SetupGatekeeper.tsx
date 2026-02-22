import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { GlassModal } from "@/components/shared/GlassModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";

export function SetupGatekeeper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSetupNeeded, setIsSetupNeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // New loading state for the button
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) checkSetupStatus();
  }, [user]);

  const checkSetupStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_setup_complete")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      
      // If the flag is false, we show the modal
      setIsSetupNeeded(data?.is_setup_complete === false);
    } catch (e) {
      console.error("Setup check failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!password || !confirmPassword) return toast.error("All fields are required");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");

    setIsUpdating(true);
    try {
      // 1. Update Auth Password in Supabase
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Mark Profile as Complete in the Database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_setup_complete: true })
        .eq("id", user?.id);
      
      if (profileError) throw profileError;
      
      // 3. REMOVE THE FORM: Update state to unlock the app
      setIsSetupNeeded(false);
      toast.success("Account secured! Dashboard unlocked.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return null;

  return (
    <>
      {/* Background is blurred and non-interactive while setup is needed */}
      <div className={isSetupNeeded ? "pointer-events-none blur-md select-none opacity-50 transition-all duration-500" : "transition-all duration-500"}>
        {children}
      </div>

      <GlassModal 
        open={isSetupNeeded} 
        onOpenChange={() => {}} // Disables closing by clicking the backdrop or pressing Escape
        title="Secure Your Account"
        description="Please establish a password to access your organization dashboard."
      >
        <form onSubmit={handleCompleteSetup} className="space-y-4 mt-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3 text-xs text-primary font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            All features are disabled until your password is set.
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password"
              type="password" 
              className="glass-input" 
              placeholder="••••••••"
              value={password} 
              disabled={isUpdating}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input 
              id="confirm-password"
              type="password" 
              className="glass-input" 
              placeholder="••••••••"
              value={confirmPassword} 
              disabled={isUpdating}
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Complete Setup & Unlock App"
            )}
          </Button>
        </form>
      </GlassModal>
    </>
  );
}