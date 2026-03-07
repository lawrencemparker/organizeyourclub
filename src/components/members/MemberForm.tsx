import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: any;
  onSuccess: () => Promise<void>;
}

export function MemberForm({ open, onOpenChange, member, onSuccess }: MemberFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  useEffect(() => {
    if (open) {
      if (member) {
        setValue("full_name", member.full_name || "");
        setValue("email", member.email || "");
        setValue("phone", member.phone || "");
        // Force incoming role to lowercase so the dropdown recognizes it perfectly
        setValue("role", member.role?.toLowerCase() || "member");
        
        // Force incoming status to standard capitalization so it matches the SelectItem perfectly
        const formattedStatus = member.status 
          ? member.status.charAt(0).toUpperCase() + member.status.slice(1).toLowerCase() 
          : "Pending";
        setValue("status", formattedStatus);
        
        setValue("major", member.major || "");
        setValue("gpa", member.gpa || "");
      } else {
        reset({
          full_name: "",
          email: "",
          phone: "",
          role: "member", // Default to lowercase member
          status: "Pending", // Default to Pending for new members
          major: "",
          gpa: ""
        });
      }
    }
  }, [open, member, setValue, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // FIX: Sanitize GPA to ensure empty string is sent as null to the numeric column
      const payload = {
        ...data,
        gpa: data.gpa && data.gpa !== "" ? parseFloat(data.gpa) : null,
      };

      let error;
      if (member) {
        const { error: updateError } = await supabase
          .from('members')
          .update(payload)
          .eq('id', member.id);
        error = updateError;
      } else {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
        const { error: insertError } = await supabase.from('members').insert({
          ...payload,
          org_id: profile?.organization_id,
        });
        error = insertError;

        // FIX: Trigger the invitation email for newly added single members
        if (!insertError) {
          const { error: invokeError } = await supabase.functions.invoke("request-access", {
            body: {
              email: payload.email,
              redirectTo: `${window.location.origin}/overview`
            }
          });
          
          if (invokeError) {
            console.error("Failed to send invite email:", invokeError);
            toast.warning("Member added, but the invitation email failed to send.");
          }
        }
      }

      if (error) throw error;
      toast.success(member ? "Member updated successfully" : "Member added and invited successfully!");
      await onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0B0F1A] border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Add Member"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {member ? "Update the details for this member." : "Add a new member to your organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name <span className="text-[var(--primary)]">*</span></Label>
              <Input {...register("full_name", { required: true })} placeholder="e.g. Lawrence Parker" className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email <span className="text-[var(--primary)]">*</span></Label>
              <Input type="email" {...register("email", { required: true })} placeholder="lawrence@example.com" className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-white" disabled={!!member} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</Label>
              <Input type="tel" {...register("phone")} placeholder="555-0123" className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</Label>
              <Select disabled={!member} onValueChange={(val) => setValue("role", val)} value={watch("role") || "member"}>
                <SelectTrigger className="bg-white/5 border-white/10 focus:ring-[var(--primary)] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1F2E] border-white/10 text-white">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="president">President</SelectItem>
                  <SelectItem value="vice president">Vice President</SelectItem>
                  <SelectItem value="social chair">Social Chair</SelectItem>
                  <SelectItem value="rush chair">Rush Chair</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
              <Select disabled={!member} onValueChange={(val) => setValue("status", val)} value={watch("status") || "Pending"}>
                <SelectTrigger className="bg-white/5 border-white/10 focus:ring-[var(--primary)] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1A1F2E] border-white/10 text-white">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Major</Label>
              <Input {...register("major")} placeholder="e.g. Business Admin" className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GPA</Label>
              <Input type="number" step="0.01" {...register("gpa")} placeholder="e.g. 3.5" className="bg-white/5 border-white/10 focus-visible:ring-[var(--primary)] text-white" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-muted-foreground hover:text-white bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[var(--primary)] text-white hover:opacity-90 min-w-[100px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (member ? "Update" : "Add Member")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}