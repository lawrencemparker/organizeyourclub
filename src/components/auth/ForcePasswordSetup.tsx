import { useState, useEffect } from "react";
import { supabase, isRecoveryFlow } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

export function ForcePasswordSetup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");

  useEffect(() => {
    const checkFlow = async () => {
      if (!user?.email) return;
      if (isRecoveryFlow) return setIsOpen(false);

      const { data } = await supabase.from("members").select("status").ilike("email", user.email);
      const hasPendingRow = data?.some(m => m.status?.toLowerCase() === "pending");
      const hasActiveRow = data?.some(m => m.status?.toLowerCase() === "active");

      setIsOpen(hasPendingRow && !hasActiveRow);
    };
    checkFlow();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (!fullName.trim()) return toast.error("Full Name is required");
    
    const parsedGpa = gpa.trim() === "" ? null : parseFloat(gpa);
    if (parsedGpa !== null && isNaN(parsedGpa)) return toast.error("Please enter a valid number for GPA");

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
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id, organization_id: memberRecord.org_id, full_name: fullName, phone: phone, role: memberRecord.role
        });
        if (profileError) throw profileError;
      }

      const { error: dbError } = await supabase.from("members").update({
        status: "Active", full_name: fullName, phone: phone, major: major, gpa: parsedGpa,
      }).ilike("email", user?.email || "");

      if (dbError) throw dbError;

      toast.success("Profile complete! Welcome to the organization.");
      setIsOpen(false);
      window.location.href = "/";

    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] bg-[#0B0F1A] border-white/10 text-white [&>button]:hidden overflow-y-auto max-h-[90vh] custom-scrollbar">
        <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4 w-full">
          <div className="mx-auto w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center w-full block">Welcome to the Organization!</DialogTitle>
          <DialogDescription className="text-center w-full block text-muted-foreground">
            To complete your registration and unlock your dashboard, please finalize your profile and secure your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</Label>
            <Input disabled value={user?.email || ""} className="bg-black/40 border-white/5 text-muted-foreground cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-[var(--primary)]">Full Name *</Label>
            <Input type="text" placeholder="First and Last Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)]" required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-[10px] uppercase font-bold text-[var(--primary)]">New Password *</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] tracking-widest" required />
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Minimum 8 characters. Must include lowercase, uppercase, digits, and symbols.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</Label>
              <Input type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">GPA</Label>
              <Input type="text" placeholder="e.g. 3.8" value={gpa} onChange={(e) => setGpa(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)]" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Major / Field of Study</Label>
              <Input type="text" placeholder="e.g. Computer Science" value={major} onChange={(e) => setMajor(e.target.value)} className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)]" />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-6">
            <Button type="submit" disabled={loading} className="w-full bg-[var(--primary)] text-white hover:opacity-90 transition-all shadow-lg">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Complete Setup & Enter Dashboard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}