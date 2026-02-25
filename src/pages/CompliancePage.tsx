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
    } catch (error) { toast.error("Failed to sync records"); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchCompliance(); }, [fetchCompliance]);

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
      toast.success("Requirement removed"); fetchCompliance();
    } catch (err) { toast.error("Delete failed"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="p-3 sm:p-5 space-y-3"> 
      <div className="flex items-center justify-end h-8">
        {canCreateCompliance && (
          <Button variant="outline" size="sm" onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="h-8 border-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/5 text-xs font-bold px-4 transition-colors">
            <Plus className="w-3 h-3 mr-2" /> Add Task
          </Button>
        )}
      </div>
      <PageHeader title="Compliance" subtitle="Chapter & University Requirements" />
      <div className="glass-card p-3 border-l-4 border-[var(--primary)] flex items-center justify-between gap-4 h-16 transition-colors duration-300">
        <div className="flex-1"><h3 className="text-xs font-bold uppercase tracking-tight text-[var(--primary)]">Overall Progress</h3><p className="text-[10px] font-medium text-muted-foreground">{stats.completed} of {stats.total} items completed</p></div>
        <div className="flex items-center gap-4"><span className="text-2xl font-black tracking-tighter text-[var(--primary)]">{stats.percent}%</span><div className="w-24 h-1.5 bg-[var(--primary)]/10 rounded-full overflow-hidden"><div className="h-full bg-[var(--primary)] transition-all duration-1000 ease-out" style={{ width: `${stats.percent}%` }} /></div></div>
      </div>
      <div className="grid gap-1.5">
        {tasks.map((task) => {
          const isExpanded = expandedId === task.id;
          const statusLower = task.status?.toLowerCase();
          return (
            <div key={task.id} className="glass-card overflow-hidden transition-all border-border/10 group">
              <div className="p-2.5 flex items-center justify-between h-14"> 
                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : task.id)}>
                  {statusLower === "completed" ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : statusLower === "overdue" ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> : <Clock className="w-4 h-4 text-orange-500 shrink-0" />}
                  <div className="min-w-0"><h4 className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors">{task.title}</h4><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Calendar className="w-3 h-3 opacity-60" /> <span className="font-medium">Due: {task.due_date}</span></div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("text-[9px] h-5 px-2 capitalize font-bold border-transparent", statusLower === "completed" ? "bg-green-500/10 text-green-500" : statusLower === "overdue" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500")}>{task.status}</Badge>
                  {canCreateCompliance && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="text-xs cursor-pointer"><Edit2 className="w-3 h-3 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive text-xs cursor-pointer" onClick={() => handleDelete(task.id)}><Trash2 className="w-3 h-3 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="px-9 pb-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] leading-relaxed text-muted-foreground italic"><div className="flex items-center gap-1.5 mb-1 text-foreground font-bold not-italic"><Info className="w-3 h-3 text-[var(--primary)]" /> Requirement Details</div>{task.description || "No additional instructions provided for this requirement."}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ComplianceForm open={isFormOpen} onOpenChange={setIsFormOpen} taskToEdit={editingTask} onSuccess={fetchCompliance} />
    </div>
  );
}