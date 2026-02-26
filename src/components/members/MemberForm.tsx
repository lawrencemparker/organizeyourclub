import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function MemberForm({ open, onOpenChange, onSuccess, member }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, member?: any }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "Member",
    status: "Pending",
    major: "",
    gpa: ""
  });

  // Pre-fill form when the "member" prop changes
  useEffect(() => {
    if (member && open) {
      setFormData({
        full_name: member.name || member.full_name || "",
        email: member.email || "",
        phone: member.phone || "",
        role: member.role || "Member",
        status: member.status || "Pending",
        major: member.major || "",
        gpa: member.gpa || ""
      });
    } else if (!member && open) {
      // Reset for a new member
      setFormData({ full_name: "", email: "", phone: "", role: "Member", status: "Pending", major: "", gpa: "" });
    }
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailToSubmit = formData.email.trim();
      
      // Get the admin's organization_id early
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
      const currentOrgId = profile?.organization_id;

      // --- MVP DUPLICATE CHECK ---
      // Check if we are adding a new member OR changing an existing member's email
      if (!member || member.email !== emailToSubmit) {
        const { data: existingMember } = await supabase
          .from('members')
          .select('id')
          .eq('org_id', currentOrgId)
          .ilike('email', emailToSubmit) // Case-insensitive check
          .maybeSingle();

        if (existingMember) {
          toast.error("This email is already registered within this organization.");
          setLoading(false);
          return; // Stop execution to prevent duplicate
        }
      }

      if (member) {
        // UPDATE EXISTING MEMBER
        const { error } = await supabase
          .from('members')
          .update({
            full_name: formData.full_name,
            email: emailToSubmit,
            phone: formData.phone,
            role: formData.role,
            status: formData.status,
            major: formData.major,
            gpa: formData.gpa
          })
          .eq('id', member.id);

        if (error) throw error;
        toast.success("Member updated successfully");

      } else {
        // ADD NEW MEMBER
        const { error: insertError } = await supabase.from('members').insert([{
          org_id: currentOrgId,
          full_name: formData.full_name,
          email: emailToSubmit,
          phone: formData.phone,
          role: formData.role,
          status: formData.status,
          major: formData.major,
          gpa: formData.gpa
        }]);
        
        if (insertError) throw insertError;
        
        // MVP FIX 1: 1500ms transaction buffer so Postgres fully commits the row before the Edge Function checks for it
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // MVP FIX 2: Use the exact same request-access Edge Function as the bulk invite, strictly checking for errors
        const { error: invokeError } = await supabase.functions.invoke("request-access", {
          body: {
            email: emailToSubmit,
            redirectTo: `${window.location.origin}/overview`
          }
        });

        if (invokeError) {
          console.error(`Invite failed for ${emailToSubmit}:`, invokeError);
          throw new Error("Member added to roster, but failed to send the invite email. Please try resending.");
        }

        toast.success("Member added and invite sent!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0B0F1A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {member ? "Edit Member" : "Add New Member"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {member 
              ? "Update the details for this member." 
              : "Add a new member and send an automated invitation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-400 uppercase">Full Name *</Label>
            <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="e.g. Boom Parker" className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Email *</Label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="user@example.com" className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Phone</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="555-0123" className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Role</Label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})} 
                disabled={!member}
                className={`flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${!member ? 'bg-black/40 opacity-60 cursor-not-allowed' : 'bg-white/5'}`}
              >
                <option value="Admin" className="bg-[#0B0F1A]">Admin</option>
                <option value="President" className="bg-[#0B0F1A]">President</option>
                <option value="Vice President" className="bg-[#0B0F1A]">Vice President</option>
                <option value="Social Chair" className="bg-[#0B0F1A]">Social Chair</option>
                <option value="Rush Chair" className="bg-[#0B0F1A]">Rush Chair</option>
                <option value="Member" className="bg-[#0B0F1A]">Member</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Status</Label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})} 
                disabled={!member}
                className={`flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${!member ? 'bg-black/40 opacity-60 cursor-not-allowed' : 'bg-white/5'}`}
              >
                <option value="Pending" className="bg-[#0B0F1A]">Pending</option>
                <option value="Active" className="bg-[#0B0F1A]">Active</option>
                <option value="Inactive" className="bg-[#0B0F1A]">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Major</Label>
              <Input value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} placeholder="e.g. Business Admin" className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">GPA</Label>
              <Input value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} placeholder="e.g. 3.5" className="bg-white/5 border-white/10 text-white focus:border-[var(--primary)]" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#EF4444] text-white hover:opacity-90 font-bold px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {member ? "Update" : "Create & Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}