import { useState, useEffect } from "react";
import { Building2, Save, Loader2, DollarSign, Mail, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function OrganizationForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dues: "",
    color: "#3b82f6", // Default blue
  });

  useEffect(() => {
    if (user) fetchOrgData();
  }, [user]);

  const fetchOrgData = async () => {
    try {
      // 1. Get the user's organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) return;
      setOrgId(profile.organization_id);

      // 2. Fetch the actual organization details
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;

      setFormData({
        name: org.name || "",
        email: org.contact_email || "",
        dues: org.default_dues ? org.default_dues.toString() : "0",
        color: org.brand_color || "#3b82f6",
      });

    } catch (error) {
      console.error("Error fetching org:", error);
      toast.error("Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          contact_email: formData.email,
          default_dues: parseFloat(formData.dues) || 0,
          brand_color: formData.color,
        })
        .eq('id', orgId);

      if (error) throw error;

      toast.success("Organization settings updated");
      
      // Reload page to force the new theme color to apply immediately
      setTimeout(() => window.location.reload(), 800);
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
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
        <h2 className="text-lg font-semibold">Organization Details</h2>
        <p className="text-sm text-muted-foreground">Manage your club's public branding and defaults.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
            <Input 
              id="orgName" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="pl-9 glass-input" 
              placeholder="e.g. Delta Sigma Pi"
            />
          </div>
        </div>

        {/* Brand Color Picker */}
        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand Color</Label>
          <div className="flex items-center gap-4 p-3 glass-card border-border/40 rounded-lg">
             <div className="relative w-10 h-10 rounded-full border-2 border-white/10 shadow-inner overflow-hidden shrink-0">
               <input 
                 type="color" 
                 id="brandColor"
                 value={formData.color}
                 onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                 className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-0 opacity-100"
                 style={{ padding: 0, margin: 0 }}
               />
             </div>
             
             <div className="flex-1">
                <Input 
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="glass-input font-mono uppercase w-32" 
                  maxLength={7}
                />
             </div>
             <div className="text-xs text-muted-foreground hidden sm:block">
               <Palette className="w-3 h-3 inline mr-1" />
               Controls buttons & accents
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="orgEmail">Contact Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="orgEmail" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="president@club.org"
              />
            </div>
            <p className="text-xs text-muted-foreground">Used as the "Reply-To" for system emails.</p>
          </div>

          {/* Default Dues */}
          <div className="space-y-2">
            <Label htmlFor="dues">Standard Semester Dues</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
              <Input 
                id="dues" 
                type="number"
                value={formData.dues} 
                onChange={(e) => setFormData({...formData, dues: e.target.value})}
                className="pl-9 glass-input" 
                placeholder="50.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">Default amount for new payment requests.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="gradient" disabled={saving}>
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