import { useState, useEffect } from "react";
import { User, Mail, Phone, GraduationCap, Award, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // We store the ID of the 'members' row to update the roster easily
  const [memberId, setMemberId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    major: "",
    gpa: "",
    role: "",
  });

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // 1. Get the Auth/Profile data (Basic info)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // 2. Get the Roster Data (Rich info like GPA, Major)
      // We match by email because 'profiles.id' and 'members.id' might differ
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('email', user?.email)
        .single();

      // Even if member fetch fails (e.g. email mismatch), we can still show profile data
      if (member) setMemberId(member.id);

      setFormData({
        fullName: profile.full_name || "",
        email: user?.email || "",
        phone: member?.phone || "",
        major: member?.major || "",
        gpa: member?.gpa || "",
        role: profile.role || "Member",
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      // 1. Update the Auth Profile (The 'Official' User Record)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // 2. Update the Member Roster (The 'Directory' Record)
      // This keeps your Members page in sync with the user's actual settings
      if (memberId) {
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            major: formData.major,
            gpa: formData.gpa ? parseFloat(formData.gpa) : null,
          })
          .eq('id', memberId);

        if (memberUpdateError) throw memberUpdateError;
      }

      toast.success("Profile updated successfully");
      
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground">Manage your public profile and contact details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Section (Visual Only for now) */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl font-bold text-primary border border-white/10">
            {formData.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" className="glass-button" disabled>
              Change Avatar
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Uploads currently disabled by admin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="fullName" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="Jane Doe"
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="email" 
                value={formData.email} 
                className="pl-9 glass-input bg-secondary/20 opacity-70 cursor-not-allowed" 
                readOnly 
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Role (Read Only) */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">Role</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 h-4 w-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <Input 
                id="role" 
                value={formData.role} 
                className="pl-9 glass-input bg-secondary/20 opacity-70 cursor-not-allowed capitalize" 
                readOnly 
              />
            </div>
          </div>

          {/* Major */}
          <div className="space-y-2">
            <Label htmlFor="major" className="text-xs font-medium text-muted-foreground">Major / Field of Study</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="major" 
                value={formData.major} 
                onChange={(e) => setFormData({...formData, major: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="Computer Science"
              />
            </div>
          </div>

          {/* GPA */}
          <div className="space-y-2">
            <Label htmlFor="gpa" className="text-xs font-medium text-muted-foreground">Current GPA</Label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="gpa" 
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={formData.gpa} 
                onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="3.8"
              />
            </div>
          </div>

        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="gradient" disabled={saving} className="min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}