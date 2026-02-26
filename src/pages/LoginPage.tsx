import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, HelpCircle, Send, CheckCircle2, Building2, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Multi-Tenant State
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !showOrgPicker) {
      // Auto-route Super Admin to their portal if they hit this page while logged in
      if (user.email === 'lawrencemparker@yahoo.com') {
        navigate("/admin");
      } else {
        navigate("/overview");
      }
    }
  }, [user, navigate, showOrgPicker]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (authData.user) {
        setTempUserId(authData.user.id);
        
        // --- SUPER ADMIN BYPASS ---
        // Instantly route to the Admin Portal, skipping the org checks.
        if (authData.user.email === 'lawrencemparker@yahoo.com') {
          navigate("/admin");
          return;
        }

        // Fetch ALL memberships for this user
        const { data: memberData } = await supabase
          .from('members')
          .select(`
            role,
            org_id,
            organizations (id, name, chapter, is_suspended)
          `)
          .ilike('email', email);

        if (memberData && memberData.length > 0) {
          if (memberData.length === 1) {
            // Single Tenant - Auto Login
            await handleSelectOrg(memberData[0], authData.user.id);
          } else {
            // Multi-Tenant - Show Picker
            setUserOrgs(memberData);
            setShowOrgPicker(true);
            setLoading(false);
            return; 
          }
        } else {
          navigate("/overview"); 
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid login credentials");
      setLoading(false);
    }
  };

  const handleSelectOrg = async (memberRecord: any, currentUserId: string | null = user?.id) => {
    try {
      setLoading(true);
      const org = Array.isArray(memberRecord.organizations) ? memberRecord.organizations[0] : memberRecord.organizations;
      
      if (org?.is_suspended) {
        await supabase.auth.signOut();
        setShowOrgPicker(false);
        throw new Error("This organization is suspended. Please contact support.");
      }

      if (currentUserId) {
        // Sync active state to Profiles table
        await supabase.from('profiles').update({ 
          role: memberRecord.role,
          organization_id: memberRecord.org_id
        }).eq('id', currentUserId);
      }

      setShowOrgPicker(false);
      navigate("/overview");
    } catch (err: any) {
      toast.error(err.message || "Failed to access organization");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSupport(true);

    try {
      const emailLower = supportEmail.trim().toLowerCase();

      const { data: isValidMember, error: rpcError } = await supabase.rpc('request_member_access', {
        email_input: emailLower
      });

      if (rpcError || !isValidMember) {
        toast.error("No account found with that email address.");
        setSendingSupport(false);
        return;
      }

      const { error: invokeError, data } = await supabase.functions.invoke("request-access", {
        body: {
          email: emailLower,
          redirectTo: "https://organizeyourclub.com/overview",
        },
      });

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setIsSuccess(true);
      setSupportEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send link. Please try again.");
    } finally {
      setSendingSupport(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F1A]">
      <div className="w-full max-w-md glass-card p-8 space-y-8 border-white/10 relative">
        
        {/* ORGANIZATION PICKER OVERLAY */}
        {showOrgPicker ? (
          <div className="absolute inset-0 bg-[#0B0F1A] rounded-2xl z-20 p-8 flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Select Organization</h2>
              <p className="text-muted-foreground text-sm font-medium">Choose which workspace to access</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {userOrgs.map((orgMember, idx) => {
                const org = Array.isArray(orgMember.organizations) ? orgMember.organizations[0] : orgMember.organizations;
                if (!org) return null;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOrg(orgMember, tempUserId)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--primary)]/50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold">
                        {org.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{org.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{orgMember.role} Access</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => { setShowOrgPicker(false); supabase.auth.signOut(); }}
              className="mt-6 w-full text-muted-foreground hover:text-white border border-white/10"
            >
              Cancel Login
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Welcome Back</h1>
              <p className="text-muted-foreground text-sm font-medium">Enter your credentials to access your organization</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" text-gray-400 className="text-xs font-bold uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-11"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[var(--primary)] text-white font-bold h-11" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="pt-6 border-t border-white/5 text-center">
              <button 
                type="button"
                onClick={() => { setIsSuccess(false); setIsSupportOpen(true); }}
                className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                Locked out or need access?
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="bg-[#0B0F1A] border-white/10 text-white sm:max-w-[400px]">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Request Access</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Enter your email to receive a new secure login link.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequestAccess} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs font-bold uppercase">Member Email</Label>
                  <Input 
                    type="email" 
                    placeholder="name@university.edu"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[var(--primary)] text-white font-bold h-11" disabled={sendingSupport}>
                  {sendingSupport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Login Link
                </Button>
              </form>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Email Sent!</h3>
                <p className="text-sm text-gray-400 px-4">
                  Check your inbox. Clicking the link will prompt you to update your password immediately.
                </p>
              </div>
              <Button onClick={() => setIsSupportOpen(false)} variant="outline" className="w-full mt-4 border-white/10">
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}