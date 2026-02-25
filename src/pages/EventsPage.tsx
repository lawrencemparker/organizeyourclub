import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Clock, MapPin, MoreVertical, Edit2, Trash2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EventForm } from "@/components/events/EventForm"; 

const EVENT_TYPES = ["All", "Meeting", "Social", "Workshop", "Professional Development", "Volunteering", "Recreational", "Past Events"];

const getTypeStyles = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('meeting')) return { bg: 'bg-[#c6f6d5] text-teal-950', badge: 'bg-black/90 text-[#c6f6d5]' };
  if (t.includes('social')) return { bg: 'bg-[#ffedd5] text-orange-950', badge: 'bg-black/90 text-[#ffedd5]' };
  if (t.includes('workshop')) return { bg: 'bg-[#dbeafe] text-blue-950', badge: 'bg-black/90 text-[#dbeafe]' };
  if (t.includes('professional')) return { bg: 'bg-[#f3e8ff] text-indigo-950', badge: 'bg-black/90 text-[#f3e8ff]' };
  if (t.includes('volunteer')) return { bg: 'bg-[#fce7f3] text-pink-950', badge: 'bg-black/90 text-[#fce7f3]' };
  if (t.includes('recreational')) return { bg: 'bg-[#fef08a] text-yellow-950', badge: 'bg-black/90 text-[#fef08a]' };
  return { bg: 'bg-slate-200 text-slate-900', badge: 'bg-black text-slate-200' };
};

export function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('role, permissions')
        .eq('email', user.email)
        .eq('org_id', profile.organization_id) 
        .maybeSingle();

      const role = currentMember?.role?.toLowerCase() || '';
      const isSuper = role === 'admin' || role === 'president';
      const perms = currentMember?.permissions?.['Events'] || {};

      // ─── URL REDIRECT SECURITY ───
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Events.");
        navigate('/overview', { replace: true });
        return; 
      }

      setCanCreate(isSuper || !!perms.create);
      setCanEdit(isSuper || !!perms.update);
      setCanDelete(isSuper || !!perms.delete);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success("Event deleted");
      fetchEvents();
    } catch (err) { toast.error("Failed to delete event"); }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    if (activeFilter === "Past Events") return events.filter(e => new Date(e.start_time) < now);
    const futureEvents = events.filter(e => new Date(e.start_time) >= now);
    if (activeFilter === "All") return futureEvents;
    return futureEvents.filter(e => (e.event_type || '').toLowerCase() === activeFilter.toLowerCase());
  }, [events, activeFilter]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" /></div>;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <PageHeader 
        title="Events Board" 
        subtitle="Schedule meetings, socials, and track attendance."
        actions={canCreate ? <Button onClick={() => { setEditingEvent(null); setIsFormOpen(true); }} className="bg-[var(--primary)] hover:opacity-90 text-white font-bold px-6 shadow-lg shadow-[var(--primary)]/20"><Plus className="w-4 h-4 mr-2" /> Schedule Event</Button> : undefined}
      />
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 flex-1">
          {EVENT_TYPES.map(type => (
            <button key={type} onClick={() => setActiveFilter(type)} className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all duration-200", activeFilter === type ? "bg-white text-black shadow-md" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white")}>{type}</button>
          ))}
        </div>
        <div className="hidden sm:flex text-xs font-bold text-muted-foreground whitespace-nowrap bg-white/5 px-3 py-1.5 rounded-full">{filteredEvents.length} EVENTS</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEvents.map((e) => {
          const startDate = new Date(e.start_time);
          const isPast = startDate < new Date();
          const fallbackStyles = getTypeStyles(e.event_type);
          const customColor = e.card_color || e.color; 
          return (
            <div key={e.id} className={cn("p-5 rounded-2xl flex flex-col relative transition-all duration-300 hover:scale-[1.02] min-h-[160px] shadow-lg", !customColor && fallbackStyles.bg, isPast && "opacity-50 grayscale")} style={customColor ? { backgroundColor: customColor, color: '#111827' } : undefined}>
              <div className="flex justify-between items-start mb-4">
                <Badge className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-black border-none", customColor ? "bg-black/90 text-white" : fallbackStyles.badge)}>{e.event_type || 'Event'}</Badge>
                <div className="flex items-start gap-1">
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10 text-current -mt-1 mr-1"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0B0F1A] border-white/10 text-white">
                        {canEdit && <DropdownMenuItem className="cursor-pointer" onClick={() => { setEditingEvent(e); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>}
                        {canDelete && <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(e.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <div className="text-right flex flex-col items-center leading-none">
                    <span className="text-[10px] font-black uppercase opacity-60 mb-0.5">{startDate.toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-black tracking-tighter">{startDate.getDate()}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 mb-4 pr-6">
                <h3 className="text-lg font-black leading-tight tracking-tight mb-1.5">{e.title}</h3>
                <p className={cn("text-xs font-semibold line-clamp-2 leading-relaxed", e.description ? "opacity-75" : "opacity-40 italic")}>{e.description || "No description provided."}</p>
              </div>
              <div className="space-y-1.5 text-xs font-semibold opacity-80 mt-auto">
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                {e.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{e.location}</span></div>}
              </div>
              <div className="absolute bottom-4 right-4"><div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 opacity-50" /></div></div>
            </div>
          );
        })}
        {(canCreate && activeFilter !== "Past Events") && (
          <button onClick={() => { setEditingEvent(null); setIsFormOpen(true); }} className="p-5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground hover:bg-white/5 hover:text-white transition-all min-h-[160px] group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-300"><Plus className="w-5 h-5" /></div><span className="text-xs font-bold uppercase tracking-wider">New Event</span>
          </button>
        )}
      </div>
      <EventForm open={isFormOpen} onOpenChange={setIsFormOpen} eventToEdit={editingEvent} onSuccess={fetchEvents} />
    </div>
  );
}