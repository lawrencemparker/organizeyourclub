import { initialEvents } from "@/lib/mockData";
import { Calendar, MapPin } from "lucide-react";

export function EventsList() {
  const upcomingEvents = initialEvents.filter(e => e.status === 'upcoming').slice(0, 3);

  return (
    <div className="glass-card p-6 h-full">
      <h3 className="font-semibold text-lg mb-1">Upcoming Events</h3>
      <p className="text-sm text-muted-foreground mb-6">Next on the schedule</p>
      
      <div className="space-y-4">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="relative pl-4 border-l-2 border-primary/20 hover:border-primary transition-colors py-1">
            <h4 className="font-medium">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>{event.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}