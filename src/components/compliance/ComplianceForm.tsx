import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Info, Calendar, Loader2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface ComplianceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: any; 
  onSuccess: () => Promise<void>;
}

export function ComplianceForm({ open, onOpenChange, taskToEdit, onSuccess }: ComplianceFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        setValue("title", taskToEdit.title);
        setValue("description", taskToEdit.description);
        setValue("status", taskToEdit.status);
        setValue("due_date", taskToEdit.due_date);
      } else {
        reset({
          status: "pending",
          due_date: new Date().toISOString().split('T')[0],
          title: "",
          description: ""
        });
      }
    }
  }, [open, taskToEdit, setValue, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      let error;
      if (taskToEdit) {
        const { error: updateError } = await supabase
          .from('compliance')
          .update(data)
          .eq('id', taskToEdit.id);
        error = updateError;
      } else {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
        const { error: insertError } = await supabase.from('compliance').insert({
          ...data,
          organization_id: profile?.organization_id,
        });
        error = insertError;
      }

      if (error) throw error;
      toast.success(taskToEdit ? "Requirement updated" : "Requirement created");
      await onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border/40 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{taskToEdit ? "Edit Requirement" : "New Requirement"}</SheetTitle>
          <SheetDescription>Set university and chapter compliance tasks.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register("title", { required: true })} placeholder="e.g. Chapter Registration" />
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="date" {...register("due_date", { required: true })} className="pl-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select onValueChange={(val) => setValue("status", val)} defaultValue={taskToEdit?.status || "pending"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Provide details or instructions..." className="min-h-[100px]" />
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (taskToEdit ? "Save Changes" : "Create Requirement")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}