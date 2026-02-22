import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { DollarSign, AlignLeft, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: any; 
  onSuccess: () => Promise<void>; 
}

export function TransactionForm({ open, onOpenChange, transactionToEdit, onSuccess }: TransactionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // We added 'watch' to actively track the dropdown state
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  
  // Track the current type to enforce the UI selection
  const currentType = watch("type");

  useEffect(() => {
    // Explicitly bind the custom dropdown to the form payload
    register("type");
    register("category");
  }, [register]);

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        setValue("description", transactionToEdit.description);
        setValue("amount", Math.abs(transactionToEdit.amount));
        setValue("type", transactionToEdit.type || (transactionToEdit.amount > 0 ? "income" : "expense"));
        setValue("category", transactionToEdit.category || "Dues");
        setValue("transaction_date", transactionToEdit.transaction_date);
      } else {
        reset({
          type: "income",
          category: "Dues",
          transaction_date: new Date().toISOString().split('T')[0],
          amount: "",
          description: ""
        });
        // Force the dropdown to 'income' on fresh open
        setValue("type", "income"); 
      }
    }
  }, [open, transactionToEdit, setValue, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Safely grab the type from our controlled state
      const transactionType = data.type || "income";
      
      const finalAmount = transactionType === 'expense' 
        ? -Math.abs(Number(data.amount)) 
        : Math.abs(Number(data.amount));

      let error;

      if (transactionToEdit) {
        const { error: updateError } = await supabase
          .from('finances')
          .update({
            description: data.description,
            amount: finalAmount,
            type: transactionType, // <--- THIS WAS MISSING
            category: data.category || 'Dues',
            transaction_date: data.transaction_date,
          })
          .eq('id', transactionToEdit.id);
        error = updateError;
      } else {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
        const { error: insertError } = await supabase.from('finances').insert({
          organization_id: profile?.organization_id,
          description: data.description,
          amount: finalAmount,
          type: transactionType, // <--- THIS WAS MISSING
          category: data.category || 'Dues',
          transaction_date: data.transaction_date,
        });
        error = insertError;
      }

      if (error) throw error;

      toast.success(transactionToEdit ? "Transaction updated" : "Transaction recorded");
      
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
          <SheetTitle>{transactionToEdit ? "Edit Transaction" : "Add Transaction"}</SheetTitle>
          <SheetDescription>Modify or record treasury activity.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Type</Label>
            {/* Swapped defaultValue for strictly controlled 'value' */}
            <Select value={currentType} onValueChange={(val) => setValue("type", val)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income (+)</SelectItem>
                <SelectItem value="expense">Expense (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input {...register("description", { required: true })} className="pl-9" placeholder="e.g. Venue Deposit" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="number" step="0.01" {...register("amount", { required: true })} className="pl-9" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="date" {...register("transaction_date", { required: true })} className="pl-9" />
            </div>
          </div>
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (transactionToEdit ? "Save Changes" : "Record Transaction")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}