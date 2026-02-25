import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: any;
  onSuccess: () => void;
}

const EVENT_TYPES = [
  "Meeting", 
  "Social", 
  "Workshop", 
  "Professional Development", 
  "Volunteering", 
  "Recreational"
];

// Recreated exact colors from your screenshot
const CARD_COLORS = [
  { id: 'mint', value: '#c6f6d5' },
  { id: 'blue', value: '#dbeafe' },
  { id: 'peach', value: '#ffedd5' },
  { id: 'purple', value: '#f3e8ff' },
  { id: 'pink', value: '#fce7f3' },
  { id: 'yellow', value: '#fef08a' }
];

export function EventForm({ open, onOpenChange, eventToEdit, onSuccess }: EventFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [eventType, setEventType] = useState("Meeting");
  const [description, setDescription] = useState("");
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);

  // Fetch user's organization on load
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setOrgId(data.organization_id);
        });
    }
  }, [user]);

  // Populate form when editing or resetting for a new event
  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        setTitle(eventToEdit.title || "");
        setLocation(eventToEdit.location || "");
        setDescription(eventToEdit.description || "");
        setEventType(eventToEdit.event_type || "Meeting");
        setCardColor(eventToEdit.card_color || eventToEdit.color || CARD_COLORS[0].value);
        
        // Parse the stored ISO string back into HTML date/time inputs
        if (eventToEdit.start_time) {
          const d = new Date(eventToEdit.start_time);
          setDate(d.toISOString().split('T')[0]); // YYYY-MM-DD
          setTime(d.toTimeString().slice(0, 5));  // HH:MM
        }
      } else {
        // Reset to defaults for New Event
        setTitle("");
        setLocation("");
        setDescription("");
        setEventType("Meeting");
        setCardColor(CARD_COLORS[0].value);
        
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime("12:00");
      }
    }
  }, [open, eventToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return toast.error("Organization not found.");
    if (!title.trim() || !date || !time) return toast.error("Title, date, and time are required.");

    setLoading(true);
    try {
      // Combine date and time back into a standard ISO timestamp for the database
      const startTimestamp = new Date(`${date}T${time}`).toISOString();

      const payload = {
        organization_id: orgId,
        title,
        location,
        description,
        start_time: startTimestamp,
        event_type: eventType,
        card_color: cardColor,
      };

      if (eventToEdit?.id) {
        // Update Existing
        const { error } = await supabase.from('events').update(payload).eq('id', eventToEdit.id);
        if (error) throw error;
        toast.success("Event updated successfully!");
      } else {
        // Create New
        const { error } = await supabase.from('events').insert([payload]);
        if (error) throw error;
        toast.success("Event added to the board!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save event.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Centered Modal Interface replacing the slide-out sheet */}
      <DialogContent className="sm:max-w-[450px] bg-[#0B0F1A] border-white/10 text-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CalendarPlus className="w-5 h-5 text-[#f97316]" /> 
            {eventToEdit ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</Label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Event name..." 
              className="bg-white/5 border-white/10 text-white focus-visible:ring-[#f97316]"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</Label>
            <Input 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              placeholder="Where?" 
              className="bg-white/5 border-white/10 text-white focus-visible:ring-[#f97316]" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[#f97316] [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] cursor-pointer" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time</Label>
              <Input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-[#f97316] [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] cursor-pointer" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Type</Label>
            <select 
              value={eventType} 
              onChange={e => setEventType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              {EVENT_TYPES.map(type => (
                <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
              ))}
            </select>
          </div>

          {/* Description Block Added */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What to expect, what to bring..." 
              rows={3}
              className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none" 
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Card Color</Label>
            <div className="flex items-center gap-3">
              {CARD_COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setCardColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform duration-200 border-2",
                    cardColor === color.value ? "scale-125 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.id} color`}
                />
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {eventToEdit ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}