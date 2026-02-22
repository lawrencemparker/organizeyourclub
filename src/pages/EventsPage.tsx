import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, MapPin, ArrowUpRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_EVENTS = [
  { id: 1, title: "Spring Intake Orientation", type: "MEETING", month: "FEB", day: 10, time: "05:35 PM", location: "Pembroke Pines, FL", color: "#c8f0e0" },
  { id: 2, title: "Weekly Chapter Meeting", type: "MEETING", month: "FEB", day: 12, time: "11:00 AM", location: "Room 304, Student Union", color: "#d4e4ff" },
  { id: 3, title: "Probate Show", type: "SOCIAL", month: "MAR", day: 1, time: "09:25 PM", location: "Courtyard", color: "#ffe8cc" },
  { id: 4, title: "Founders Day Gala", type: "SOCIAL", month: "APR", day: 15, time: "08:00 PM", location: "Downtown Hotel", color: "#f5d4ff" },
];

const TYPE_COLORS: Record<string, { pill: string, text: string }> = {
  MEETING: { pill: "#000000", text: "#ffffff" },
  SOCIAL:  { pill: "#f97316", text: "#ffffff" },
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const COLOR_OPTIONS = ["#c8f0e0", "#d4e4ff", "#ffe8cc", "#f5d4ff", "#ffd4d4", "#d4f5e9"];

export function EventsPage() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filter, setFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    title: "", 
    type: "MEETING", 
    month: "JAN", 
    day: 1, 
    time: "12:00 PM", 
    location: "", 
    color: "#c8f0e0" 
  });

  const filtered = filter === "ALL" ? events : events.filter(e => e.type === filter);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setEvents(p => [...p, { ...form, id: Date.now() }]);
    setShowModal(false);
    setForm({ title: "", type: "MEETING", month: "JAN", day: 1, time: "12:00 PM", location: "", color: "#c8f0e0" });
  };

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header matching the app's layout */}
      <PageHeader 
        title="Events Board" 
        subtitle="Schedule meetings, socials, and track attendance."
        actions={
          <Button onClick={() => setShowModal(true)} className="bg-[var(--primary)] text-white hover:opacity-90 shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        }
      />

      {/* Filter Controls */}
      <div className="flex items-center gap-2 pb-2">
        {["ALL", "MEETING", "SOCIAL"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-200",
              filter === f 
                ? "bg-white text-black shadow-md" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-sm font-bold text-white">{filtered.length}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Events</span>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((event) => (
          <div
            key={event.id}
            style={{ backgroundColor: event.color }}
            className="rounded-3xl p-6 flex flex-col gap-4 min-h-[220px] cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group border border-transparent hover:border-white/20"
          >
            {/* Card Top */}
            <div className="flex justify-between items-start">
              <span 
                className="text-[10px] font-extrabold tracking-widest px-3 py-1.5 rounded-full shadow-sm"
                style={{ background: TYPE_COLORS[event.type]?.pill, color: TYPE_COLORS[event.type]?.text }}
              >
                {event.type}
              </span>
              <div className="flex flex-col items-center bg-black/10 rounded-xl px-3 py-1 shadow-inner">
                <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase">{event.month}</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{event.day}</span>
              </div>
            </div>

            {/* Card Title */}
            <h3 className="text-2xl font-black text-slate-900 leading-tight mt-2 flex-1">
              {event.title}
            </h3>

            {/* Card Bottom */}
            <div className="flex justify-between items-end mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Clock className="w-4 h-4 opacity-70" /> {event.time}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <MapPin className="w-4 h-4 opacity-70" /> {event.location}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <ArrowUpRight className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </div>
        ))}

        {/* Add New Placeholder Card */}
        <div
          onClick={() => setShowModal(true)}
          className="rounded-3xl p-6 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 min-h-[220px] cursor-pointer hover:bg-white/5 hover:border-[var(--primary)]/50 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-[var(--primary)]" />
          </div>
          <span className="text-sm font-bold text-muted-foreground tracking-wider group-hover:text-white transition-colors">NEW EVENT</span>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">No {filter !== "ALL" ? filter.toLowerCase() : ""} events scheduled.</p>
        </div>
      )}

      {/* Integrated Dialog Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px] bg-[#0B0F1A] border-white/10 text-white p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[var(--primary)]" /> Create New Event
            </DialogTitle>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Title</Label>
              <Input 
                required
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Event name..." 
                className="bg-white/5 border-white/10" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Location</Label>
              <Input 
                value={form.location} 
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                placeholder="Where?" 
                className="bg-white/5 border-white/10" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Date</Label>
                <div className="flex gap-2">
                  <select 
                    value={form.month} 
                    onChange={e => setForm(f => ({ ...f, month: e.target.value }))} 
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                  >
                    {MONTHS.map(m => <option key={m} className="bg-[#0B0F1A] text-white">{m}</option>)}
                  </select>
                  <Input 
                    type="number" 
                    min={1} max={31} 
                    value={form.day} 
                    onChange={e => setForm(f => ({ ...f, day: +e.target.value }))} 
                    className="bg-white/5 border-white/10 w-20 text-center" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Time</Label>
                <Input 
                  value={form.time} 
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} 
                  placeholder="09:00 AM" 
                  className="bg-white/5 border-white/10" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Event Type</Label>
              <select 
                value={form.type} 
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))} 
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
              >
                <option className="bg-[#0B0F1A] text-white">MEETING</option>
                <option className="bg-[#0B0F1A] text-white">SOCIAL</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Card Color</Label>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 shadow-sm",
                      form.color === c ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[#0B0F1A] scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" className="bg-[var(--primary)] text-white hover:opacity-90 font-bold">
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}