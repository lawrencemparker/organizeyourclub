import { Clock, MapPin, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventProps {
  event: any;
  onEdit: (event: any) => void;
  // 1. ADD THIS TO THE INTERFACE
  onDelete: (id: string) => void; 
}

// 2. ADD onDelete TO THE DESTRUCTURED PROPS
export function EventCard({ event, onEdit, onDelete }: EventProps) {
  const date = event.start_time ? new Date(event.start_time) : new Date();

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/20">
      <div className="flex items-start gap-4">
        
        {/* Date Badge */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-primary border border-primary/20 min-w-[60px] h-16 shrink-0">
          <span className="text-xs font-bold uppercase">{format(date, "MMM")}</span>
          <span className="text-xl font-bold">{format(date, "d")}</span>
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-6">
              <h3 
                title={event.title} 
                className="font-semibold text-lg leading-tight line-clamp-2 text-foreground mb-1 break-words"
              >
                {event.title}
              </h3>
              
              <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border border-white/5">
                {event.event_type}
              </span>
            </div>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => onEdit(event)} className="cursor-pointer">
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                
                {/* 3. ATTACH THE ONCLICK HANDLER HERE */}
                <DropdownMenuItem 
                  onClick={() => onDelete(event.id)} 
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{format(date, "h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="truncate" title={event.location || "TBD"}>
                {event.location || "Location TBD"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}