import { CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ComplianceStatus() {
  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4">Compliance Status</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-sm font-bold text-primary">85%</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Completed</span>
            </div>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-warning">Pending</span>
            </div>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>
      </div>
    </div>
  );
}