import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function GlassModal({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  className 
}: GlassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("bg-[#0B0F1A]/95 border-white/10 backdrop-blur-xl text-white sm:max-w-[600px]", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}