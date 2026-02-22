import { useState } from "react";
import { Lock, Save, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function SecurityForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Security Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your password and account security.</p>
      </div>

      <div className="p-4 mb-6 rounded-lg bg-primary/5 border border-primary/20 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Your account is secure</p>
          <p className="text-muted-foreground mt-1">
            We recommend using a unique password that you don't use for other online accounts.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 max-w-md">
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="newPassword" 
                type={showPassword ? "text" : "password"}
                value={formData.newPassword} 
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="pl-9 pr-10 glass-input" 
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground/50 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="confirmPassword" 
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="Confirm new password"
              />
            </div>
          </div>

        </div>

        <div className="pt-4">
          <Button type="submit" variant="gradient" disabled={loading || !formData.newPassword}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}