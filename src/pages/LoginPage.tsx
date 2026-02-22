import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Mail, HelpCircle, Send, CheckCircle2 } from "lucide-react";
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

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // NEW: INTERCEPT SUSPENDED ORGS
      if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', authData.user.id).single();
        if (profile?.organization_id) {
          const { data: org } = await supabase.from('organizations').select('is_suspended').eq('id', profile.organization_id).single();
          if (org?.is_suspended) {
            await supabase.auth.signOut();
            throw new Error("Please contact App Administrator for access.");
          }
        }
      }

      navigate("/"); 
    } catch (err: any) {
      toast.error(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSupport(true);

    try {
      // Find the user's organization in the members table
      const { data: memberData } = await supabase
        .from('members')
        .select('org_id')
        .eq('email', supportEmail.trim().toLowerCase())
        .maybeSingle();

      // NEW: INTERCEPT SUSPENDED ORGS BEFORE SENDING LINK
      if (memberData?.org_id) {
        const { data: org } = await supabase.from('organizations').select('is_suspended').eq('id', memberData.org_id).single();
        if (org?.is_suspended) {
          toast.error("Please contact App Administrator for access.");
          setSendingSupport(false);
          return;
        }
      }

      // 1. Reset database state to 'Pending' via SQL function
      const { data: isValidMember, error: rpcError } = await supabase.rpc('request_member_access', {
        email_input: supportEmail.trim().toLowerCase()
      });

      if (rpcError || !isValidMember) {
        toast.error("No account found with that email address.");
        return;
      }

      // 2. Use resetPasswordForEmail - it is higher priority for custom SMTP
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        supportEmail.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (resetError) throw resetError;

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
      <div className="w-full max-w-md glass-card p-8 space-y-8 border-white/10">
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