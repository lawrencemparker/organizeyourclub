import { useState, useEffect } from "react";
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

export function ForcePasswordSetup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");
  
  // Password Fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Auto-detect if the user is a new invitee who needs to set a password & complete profile
  useEffect(() => {
    let isMounted = true;
    
    async function checkActivationStatus() {
      if (!user?.email) return;

      try {
        // Check if the user is still listed as "Pending" and grab any placeholder data
        const { data, error } = await supabase
          .from('members')
          .select('status, full_name, phone, major, gpa')
          .eq('email', user.email)
          .maybeSingle();

        // If their status is Pending, they used a magic link and MUST complete setup
        if (!error && data && data.status?.toLowerCase() === 'pending') {
          if (isMounted) {
            const fetchedName = data.full_name || "";
            const emailPrefix = user.email.split('@')[0];
            
            // FIX: If they are trapped with the old auto-generated email prefix bug, clear it out.
            setFullName(fetchedName === emailPrefix ? "" : fetchedName);
            
            setPhone(data.phone || "");
            setMajor(data.major || "");
            setGpa(data.gpa?.toString() || "");
            setOpen(true);
          }
        }
      } catch (err) {
        console.error("Error checking member status:", err);
      }
    }
    
    checkActivationStatus();
    
    return () => { isMounted = false; };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    // Strict password validation matching security settings
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update the password AND the Auth Metadata (This forces the Sidebar to update!)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { full_name: fullName }
      });

      if (updateError) throw updateError;

      // 2. Format GPA to ensure empty string is sent as null to the numeric column
      const numericGpa = gpa && gpa !== "" ? parseFloat(gpa) : null;

      // 3. Auto-activate the user AND save their profile data in the members table
      const { error: memberError } = await supabase
        .from('members')
        .update({ 
          status: 'Active',
          full_name: fullName,
          phone: phone,
          major: major,
          gpa: numericGpa
        })
        .eq('email', user.email);

      if (memberError) {
         console.error("Failed to update member profile:", memberError);
         throw memberError;
      }
      
      // 4. Update the profiles table just to ensure global consistency
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);

      // 5. Complete the setup and force app reload to sync global state completely
      toast.success("Profile completed & password secured! Welcome to the platform.");
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete account setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing by clicking outside if they haven't set a password
      if (val === false) return; 
      setOpen(val);
    }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0B0F1A] border-white/10 text-white shadow-2xl [&>button]:hidden">
        <DialogHeader className="text-left mb-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 border border-[var(--primary)]/20">
            <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle className="text-2xl font-black">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5">
            You've been invited! Please fill out your details and set a secure password to activate your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Full Name <span className="text-[var(--primary)]">*</span>
              </Label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="e.g. Lawrence Parker" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                required 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
              <Input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="555-0123" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Major</Label>
              <Input 
                value={major} 
                onChange={(e) => setMajor(e.target.value)} 
                placeholder="e.g. Business Admin" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GPA</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={gpa} 
                onChange={(e) => setGpa(e.target.value)} 
                placeholder="e.g. 3.5" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                New Password <span className="text-[var(--primary)]">*</span>
              </Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                required 
              />
              <p className="text-[10px] text-muted-foreground pt-1">
                Minimum 8 characters. Must include lowercase, uppercase, digits, and symbols.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Confirm Password <span className="text-[var(--primary)]">*</span>
              </Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[var(--primary)]"
                required 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-6">
            <Button type="submit" disabled={loading} className="w-full bg-[var(--primary)] text-white hover:opacity-90 h-11 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Saving Profile..." : "Save Profile & Enter App"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}