import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
  delay?: number;
}

export function StatCard({ title, value, change, changeType, icon: Icon, iconColor, delay = 0 }: StatCardProps) {
  return (
    <div 
      className="glass-card p-6 animate-fade-in hover:translate-y-[-2px] transition-transform duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-lg bg-secondary/30", iconColor.replace("text-", "bg-").replace("500", "500/10"))}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className={cn(
          "text-xs font-medium",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      </div>
    </div>
  );
}