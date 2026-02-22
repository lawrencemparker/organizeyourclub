import { Link } from "react-router-dom";
import { initialMembers } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export function MembersTable() {
  const recentMembers = initialMembers.slice(0, 5);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Recent Members</h3>
          <p className="text-sm text-muted-foreground">Newest additions to the roster</p>
        </div>
        
        {/* ADDED: Link wrapper to make the badge clickable */}
        <Link to="/members">
          <Badge 
            variant="outline" 
            className="border-primary/20 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
          >
            View All
          </Badge>
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold">
                {member.avatar}
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-secondary/50">
              {member.joined}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}