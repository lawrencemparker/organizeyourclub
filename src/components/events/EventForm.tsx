import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Calendar, Clock, MapPin, AlignLeft, Type, Loader2 } from "lucide-react";
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

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: any; // If present, we are in EDIT mode
  onSuccess: () => void;
}

export function EventForm({ open, onOpenChange, eventToEdit, onSuccess }: EventFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  // Reset form when opening/closing or switching modes
  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        // PRE-FILL FOR EDITING
        setValue("title", eventToEdit.title);
        setValue("location", eventToEdit.location);
        setValue("event_type", eventToEdit.event_type);
        setValue("description", eventToEdit.description);
        
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const date = new Date(eventToEdit.start_time);
        const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setValue("start_time", localIso);
      } else {
        // RESET FOR CREATING
        reset({
          title: "",
          location: "",
          event_type: "meeting",
          description: "",
          start_time: ""
        });
      }
    }
  }, [open, eventToEdit, setValue, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Get Org ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error("No organization found");

      if (eventToEdit) {
        // --- UPDATE EXISTING ---
        const { error } = await supabase
          .from('events')
          .update({
            title: data.title,
            start_time: new Date(data.start_time).toISOString(),
            location: data.location,
            event_type: data.event_type,
            description: data.description,
          })
          .eq('id', eventToEdit.id);
        
        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        // --- CREATE NEW ---
        const { error } = await supabase
          .from('events')
          .insert({
            organization_id: profile.organization_id,
            title: data.title,
            start_time: new Date(data.start_time).toISOString(),
            location: data.location,
            event_type: data.event_type,
            description: data.description,
            created_by: user?.id
          });

        if (error) throw error;
        toast.success("Event created successfully");
      }

      onSuccess(); // Refresh parent list
      onOpenChange(false); // Close sheet
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border/40 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{eventToEdit ? "Edit Event" : "Create New Event"}</SheetTitle>
          <SheetDescription>
            {eventToEdit ? "Make changes to your event details below." : "Schedule a new meeting, social, or fundraiser."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Title */}
          <div className="space-y-2">
            <Label>Event Title</Label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input {...register("title", { required: true })} className="pl-9" placeholder="e.g. Weekly Chapter Meeting" />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select 
              onValueChange={(val) => setValue("event_type", val)} 
              defaultValue={eventToEdit?.event_type || "meeting"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="fundraiser">Fundraiser</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="datetime-local" 
                {...register("start_time", { required: true })} 
                className="pl-9 block" 
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input {...register("location")} className="pl-9" placeholder="e.g. Student Union Room 304" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea 
                {...register("description")} 
                className="pl-9 min-h-[100px]" 
                placeholder="Add agenda items or details..." 
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                eventToEdit ? "Save Changes" : "Create Event"
              )}
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}