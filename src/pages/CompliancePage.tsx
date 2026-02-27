import { useEffect, useState, useMemo, useCallback } from "react";
import { CheckCircle2, AlertCircle, Clock, Loader2, Calendar, Info, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ComplianceForm } from "@/components/compliance/ComplianceForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function CompliancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [canCreateCompliance, setCanCreateCompliance] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const fetchCompliance = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('id, role, permissions')
        .eq('email', user.email)
        .eq('org_id', profile.organization_id)
        .maybeSingle();
      
      const role = currentMember?.role?.toLowerCase() || '';
      const isSuper = role === 'admin' || role === 'president';
      const perms = currentMember?.permissions?.['Compliance'] || {};

      // ─── URL REDIRECT SECURITY ───
      if (!isSuper && perms.read === false) {
        toast.error("Access Denied: You do not have permission to view Compliance.");
        navigate('/overview', { replace: true });
        return; 
      }

      setCanCreateCompliance(isSuper || !!perms.create);

      const { data, error } = await supabase
        .from('compliance')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('due_date', { ascending: true });
      if (error) throw error;

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const fetchedTasks = data || [];
      for (const task of fetchedTasks) {
        if (task.status?.toLowerCase() === 'pending' && task.due_date < todayStr) {
          await supabase.from('compliance').update({ status: 'Overdue' }).eq('id', task.id);
          task.status = 'Overdue';
        }
      }
      setTasks(fetchedTasks);
    } catch (error) { 
      toast.error("Failed to sync records"); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { 
    fetchCompliance(); 
  }, [fetchCompliance]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status?.toLowerCase() === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percent, completed, total };
  }, [tasks]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this requirement?")) return;
    try {
      const { error } = await supabase.from('compliance').delete().eq('id', id);
      if (error) throw error;
      toast.success("Requirement removed"); 
      fetchCompliance();
    } catch (err) { 
      toast.error("Delete failed"); 
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8"> 
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Compliance" subtitle="Chapter & University Requirements" />
        {canCreateCompliance && (
          <Button 
            onClick={() => { setEditingTask(null); setIsFormOpen(true); }} 
            className="bg-[var(--primary)] text-white hover:opacity-90 transition-all shadow-lg font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Requirement
          </Button>
        )}
      </div>

      {/* OVERALL PROGRESS: Decreased width by 65% (taking up 35% space) and left-justified */}
      <div className="w-full lg:w-[35%]">
        <div className="glass-card p-4 border-l-4 border-[var(--primary)] flex items-center justify-between gap-4 h-auto shadow-sm transition-colors duration-300">
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-tight text-[var(--primary)]">Overall Progress</h3>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{stats.completed} of {stats.total} items completed</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-[var(--primary)]">{stats.percent}%</span>
            <div className="w-16 h-1.5 bg-[var(--primary)]/10 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-out" style={{ width: `${stats.percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* NEW CARD DESIGN FOR COMPLIANCE TASKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tasks.map((task) => {
          const statusLower = task.status?.toLowerCase();
          return (
            <div key={task.id} className="glass-card flex flex-col p-5 gap-4 relative border border-white/5 hover:border-[var(--primary)]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 shrink-0 flex items-center justify-center">
                    {statusLower === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : statusLower === "overdue" ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="pt-0.5">
                    <h4 className="text-sm font-bold text-white leading-tight mb-1.5">{task.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Calendar className="w-3 h-3 opacity-70" /> Due: {task.due_date}
                    </div>
                  </div>
                </div>

                {/* CRUD ACTIONS - Permissions Intact */}
                {canCreateCompliance && (
                  <div className="shrink-0 -mr-2 -mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-[#1A1F2E] border-white/10 text-white">
                        <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="text-xs cursor-pointer hover:bg-white/5 focus:bg-white/5">
                          <Edit2 className="w-3 h-3 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-400 text-xs cursor-pointer hover:bg-rose-400/10 focus:bg-rose-400/10" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* DESCRIPTION AREA */}
              <div className="flex-1 text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {task.description || "No additional instructions provided for this requirement."}
              </div>

              {/* CARD FOOTER & STATUS */}
              <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] px-3 py-1 capitalize font-bold border", 
                    statusLower === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    statusLower === "overdue" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}
                >
                  {task.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
      
      <ComplianceForm open={isFormOpen} onOpenChange={setIsFormOpen} taskToEdit={editingTask} onSuccess={fetchCompliance} />
    </div>
  );
}